use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::Utc;
use serde::Deserialize;

use brier_error::BrierError;
use brier_type::enums::{TaskPriority, TaskSource, TaskStatus};
use brier_type::id::{AgentId, TaskId, WorkspaceId};
use brier_type::tunnel::ServerMessage;
use brier_type::AgentTask;
use brier_tunnel::publish_task_event;
use crate::error::ApiError;
use crate::routes::current_user;
use crate::AppState;

#[derive(Deserialize, utoipa::ToSchema)]
pub struct CreateTaskRequest {
    pub agent_id: AgentId,
    pub title: String,
    /// 自然语言指令（AI runtime 模式：CLI 会拼成该 runtime 的执行参数）。
    pub prompt: Option<String>,
    /// 显式 shell 命令（高级用法，绕过 runtime；prompt 与 command 至少其一）。
    pub command: Option<String>,
    pub priority: Option<TaskPriority>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/workspaces/{workspace_id}/tasks",
            get(list_tasks).post(create_task),
        )
        .route(
            "/api/workspaces/{workspace_id}/tasks/{task_id}",
            get(get_task),
        )
        .route(
            "/api/workspaces/{workspace_id}/tasks/{task_id}/cancel",
            post(cancel_task),
        )
}

#[utoipa::path(
    get,
    path = "/api/workspaces/{workspace_id}/tasks",
    params(("workspace_id" = WorkspaceId, Path, description = "工作空间 ID")),
    responses(
        (status = 200, description = "Agent 任务列表", body = [AgentTask]),
        (status = 401, description = "未登录"),
        (status = 404, description = "空间不存在或无权限")
    )
)]
pub(crate) async fn list_tasks(
    State(state): State<AppState>,
    Path(workspace_id): Path<WorkspaceId>,
    headers: HeaderMap,
) -> Result<Json<Vec<AgentTask>>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let tasks = brier_agent::repository::list_agent_tasks_by_workspace(&state.db, workspace_id).await?;
    Ok(Json(tasks))
}

#[utoipa::path(
    post,
    path = "/api/workspaces/{workspace_id}/tasks",
    params(("workspace_id" = WorkspaceId, Path, description = "工作空间 ID")),
    request_body = CreateTaskRequest,
    responses(
        (status = 200, description = "创建成功并已下发执行", body = AgentTask),
        (status = 400, description = "Agent 未绑定电脑 / 电脑离线 / 缺少指令"),
        (status = 401, description = "未登录"),
        (status = 404, description = "空间/Agent 不存在或无权限")
    )
)]
pub(crate) async fn create_task(
    State(state): State<AppState>,
    Path(workspace_id): Path<WorkspaceId>,
    headers: HeaderMap,
    Json(req): Json<CreateTaskRequest>,
) -> Result<Json<AgentTask>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;

    // 1. Agent 必须属于该空间
    let agent = brier_agent::repository::get_agent(&state.db, req.agent_id)
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("agent not found".into())))?;
    if agent.workspace_id != workspace_id {
        return Err(ApiError(BrierError::NotFound("agent not found".into())));
    }

    // 2. 指令与执行方式：prompt（runtime 模式）或 command（shell 模式）至少其一
    if req.prompt.as_deref().map(str::trim).unwrap_or("").is_empty()
        && req.command.as_deref().map(str::trim).unwrap_or("").is_empty()
    {
        return Err(ApiError(BrierError::Validation(
            "prompt 或 command 至少提供一项".into(),
        )));
    }

    // 3. 电脑必须已绑定且在线（隧道已注册）
    let computer_id = agent.work_computer_id.ok_or_else(|| {
        ApiError(BrierError::Validation(
            "Agent 未绑定工作电脑，无法下发任务".into(),
        ))
    })?;
    if !state
        .tunnel_registry
        .is_online(&computer_id.to_string())
        .await
    {
        return Err(ApiError(BrierError::Validation(
            "目标工作电脑当前离线，请稍后重试".into(),
        )));
    }
    let runtime = if req.command.is_some() {
        None
    } else {
        let rt = agent
            .runtime
            .as_deref()
            .map(str::trim)
            .filter(|r| !r.is_empty())
            .ok_or_else(|| {
                ApiError(BrierError::Validation("Agent 未配置 runtime".into()))
            })?;
        Some(rt.to_string())
    };

    // 4. 落库（pending）
    let now = Utc::now();
    let title = if req.title.trim().is_empty() {
        req.prompt
            .as_deref()
            .unwrap_or_default()
            .chars()
            .take(40)
            .collect::<String>()
    } else {
        req.title
    };
    let task = AgentTask {
        id: TaskId::new(),
        workspace_id,
        creator_id: user.id,
        agent_id: req.agent_id,
        computer_id: Some(computer_id),
        title,
        prompt: req.prompt,
        command: req.command,
        runtime,
        status: TaskStatus::Pending,
        priority: req.priority.unwrap_or(TaskPriority::Medium),
        source: TaskSource::Manual,
        output: String::new(),
        exit_code: None,
        error: None,
        started_at: None,
        finished_at: None,
        created_at: now,
        updated_at: now,
    };
    let created = brier_agent::repository::create_agent_task(&state.db, task).await?;
    let task_id = created.id;
    let _ = brier_agent::repository::touch_agent_activity(&state.db, req.agent_id, now).await;

    // 5. 经隧道下发；失败则置 failed
    let started = state
        .tunnel_registry
        .send(
            &computer_id.to_string(),
            ServerMessage::TaskStart {
                task_id: task_id.to_string(),
                runtime: created.runtime.clone().unwrap_or_default(),
                command: created.command.clone().unwrap_or_default(),
                args: Vec::new(),
                cwd: None,
                env: None,
                prompt: created.prompt.clone(),
            },
        )
        .await;
    if started {
        let _ = brier_agent::repository::mark_task_running(&state.db, task_id, now).await;
    } else {
        let _ = brier_agent::repository::fail_task(
            &state.db,
            task_id,
            computer_id,
            "发送任务到工作电脑失败",
            now,
        )
        .await;
    }

    let final_task = brier_agent::repository::get_agent_task(&state.db, task_id)
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("task not found".into())))?;
    publish_task_event(&state.event_bus, &user.id, &final_task).await;
    Ok(Json(final_task))
}

#[utoipa::path(
    get,
    path = "/api/workspaces/{workspace_id}/tasks/{task_id}",
    params(
        ("workspace_id" = WorkspaceId, Path, description = "工作空间 ID"),
        ("task_id" = TaskId, Path, description = "任务 ID")
    ),
    responses(
        (status = 200, description = "任务详情（含输出）", body = AgentTask),
        (status = 401, description = "未登录"),
        (status = 404, description = "任务不存在或无权限")
    )
)]
pub(crate) async fn get_task(
    State(state): State<AppState>,
    Path((workspace_id, task_id)): Path<(WorkspaceId, TaskId)>,
    headers: HeaderMap,
) -> Result<Json<AgentTask>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let task = get_task_in_workspace(&state, workspace_id, task_id).await?;
    Ok(Json(task))
}

#[utoipa::path(
    get,
    path = "/api/workspaces/{workspace_id}/tasks/{task_id}/cancel",
    params(
        ("workspace_id" = WorkspaceId, Path, description = "工作空间 ID"),
        ("task_id" = TaskId, Path, description = "任务 ID")
    ),
    responses(
        (status = 200, description = "已取消", body = AgentTask),
        (status = 401, description = "未登录"),
        (status = 404, description = "任务不存在或无权限")
    )
)]
pub(crate) async fn cancel_task(
    State(state): State<AppState>,
    Path((workspace_id, task_id)): Path<(WorkspaceId, TaskId)>,
    headers: HeaderMap,
) -> Result<Json<AgentTask>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let before = get_task_in_workspace(&state, workspace_id, task_id).await?;
    let was_running = before.status == TaskStatus::Running;
    let computer_id = before.computer_id;

    let now = Utc::now();
    let updated = match brier_agent::repository::cancel_agent_task(&state.db, task_id, now).await? {
        Some(t) => t,
        None => before, // 已终态：幂等返回现状
    };

    // 正在运行时通知 CLI 终止进程
    if updated.status == TaskStatus::Cancelled && was_running {
        if let Some(cid) = computer_id {
            let _ = state
                .tunnel_registry
                .send(&cid.to_string(), ServerMessage::TaskCancel {
                    task_id: task_id.to_string(),
                })
                .await;
        }
    }
    publish_task_event(&state.event_bus, &user.id, &updated).await;
    Ok(Json(updated))
}

async fn get_task_in_workspace(
    state: &AppState,
    workspace_id: WorkspaceId,
    task_id: TaskId,
) -> Result<AgentTask, ApiError> {
    let task = brier_agent::repository::get_agent_task(&state.db, task_id)
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("task not found".into())))?;
    if task.workspace_id != workspace_id {
        return Err(ApiError(BrierError::NotFound("task not found".into())));
    }
    Ok(task)
}

async fn check_workspace_access(
    state: &AppState,
    workspace_id: &WorkspaceId,
    user_id: &brier_type::id::UserId,
) -> Result<(), ApiError> {
    let ws = brier_workspace::repository::get_workspace_for_user(&state.db, workspace_id, user_id)
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("workspace not found".into())))?;
    let _ = ws;
    Ok(())
}
