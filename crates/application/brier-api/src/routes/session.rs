use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::Utc;
use serde::Deserialize;

use brier_error::BrierError;
use brier_type::enums::MessageRole;
use brier_type::id::{AgentId, SessionId, TaskId, WorkspaceId};
use brier_type::{Session, SessionMessage};

use crate::error::ApiError;
use crate::routes::current_user;
use crate::AppState;

#[derive(Deserialize, utoipa::ToSchema)]
pub struct CreateSessionRequest {
    pub agent_id: AgentId,
    /// 首条用户消息（同时作为会话默认标题来源）。
    pub first_message: String,
    pub title: Option<String>,
}

#[derive(Deserialize, utoipa::ToSchema)]
pub struct AppendMessageRequest {
    pub role: MessageRole,
    pub content: String,
    /// agent 回复时指定执行 Agent；user 消息省略。
    pub agent_id: Option<AgentId>,
    /// 关联的 Agent 任务（agent 回复 = 任务输出回填）。
    pub task_id: Option<TaskId>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/workspaces/{workspace_id}/sessions",
            get(list_sessions).post(create_session),
        )
        .route(
            "/api/workspaces/{workspace_id}/sessions/{session_id}/messages",
            get(list_messages).post(append_message),
        )
        .route(
            "/api/workspaces/{workspace_id}/sessions/{session_id}",
            axum::routing::delete(delete_session),
        )
}

#[utoipa::path(
    get,
    path = "/api/workspaces/{workspace_id}/sessions",
    params(("workspace_id" = WorkspaceId, Path, description = "工作空间 ID")),
    responses(
        (status = 200, description = "会话列表（按更新时间倒序）", body = [Session]),
        (status = 401, description = "未登录"),
        (status = 404, description = "空间不存在或无权限")
    )
)]
pub(crate) async fn list_sessions(
    State(state): State<AppState>,
    Path(workspace_id): Path<WorkspaceId>,
    headers: HeaderMap,
) -> Result<Json<Vec<Session>>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let sessions = brier_agent::repository::list_sessions_by_workspace(&state.db, workspace_id).await?;
    Ok(Json(sessions))
}

#[utoipa::path(
    post,
    path = "/api/workspaces/{workspace_id}/sessions",
    params(("workspace_id" = WorkspaceId, Path, description = "工作空间 ID")),
    request_body = CreateSessionRequest,
    responses(
        (status = 200, description = "创建成功（含首条消息）", body = Session),
        (status = 401, description = "未登录"),
        (status = 404, description = "空间/Agent 不存在或无权限")
    )
)]
pub(crate) async fn create_session(
    State(state): State<AppState>,
    Path(workspace_id): Path<WorkspaceId>,
    headers: HeaderMap,
    Json(req): Json<CreateSessionRequest>,
) -> Result<Json<Session>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let agent = brier_agent::repository::get_agent(&state.db, req.agent_id)
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("agent not found".into())))?;
    if agent.workspace_id != workspace_id {
        return Err(ApiError(BrierError::NotFound("agent not found".into())));
    }

    let now = Utc::now();
    let first = req.first_message.trim();
    if first.is_empty() {
        return Err(ApiError(BrierError::Validation(
            "first_message 不能为空".into(),
        )));
    }
    let title = match req.title {
        Some(t) if !t.trim().is_empty() => t,
        _ => first.chars().take(30).collect(),
    };
    let session = Session {
        id: SessionId::new(),
        workspace_id,
        creator_id: user.id,
        agent_id: req.agent_id,
        title,
        created_at: now,
        updated_at: now,
    };
    let created = brier_agent::repository::create_session(&state.db, session).await?;

    let _ = brier_agent::repository::append_session_message(
        &state.db,
        SessionMessage {
            id: brier_type::id::SessionMessageId::new(),
            session_id: created.id,
            role: MessageRole::User,
            content: first.to_string(),
            agent_id: None,
            task_id: None,
            created_at: now,
        },
        now,
    )
    .await;
    Ok(Json(created))
}

#[utoipa::path(
    get,
    path = "/api/workspaces/{workspace_id}/sessions/{session_id}/messages",
    params(
        ("workspace_id" = WorkspaceId, Path, description = "工作空间 ID"),
        ("session_id" = SessionId, Path, description = "会话 ID")
    ),
    responses(
        (status = 200, description = "消息历史（正序）", body = [SessionMessage]),
        (status = 401, description = "未登录"),
        (status = 404, description = "会话不存在或无权限")
    )
)]
pub(crate) async fn list_messages(
    State(state): State<AppState>,
    Path((workspace_id, session_id)): Path<(WorkspaceId, SessionId)>,
    headers: HeaderMap,
) -> Result<Json<Vec<SessionMessage>>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    get_session_in_workspace(&state, workspace_id, session_id).await?;
    let messages = brier_agent::repository::list_messages_by_session(&state.db, session_id).await?;
    Ok(Json(messages))
}

#[utoipa::path(
    post,
    path = "/api/workspaces/{workspace_id}/sessions/{session_id}/messages",
    params(
        ("workspace_id" = WorkspaceId, Path, description = "工作空间 ID"),
        ("session_id" = SessionId, Path, description = "会话 ID")
    ),
    request_body = AppendMessageRequest,
    responses(
        (status = 200, description = "追加成功", body = SessionMessage),
        (status = 401, description = "未登录"),
        (status = 404, description = "会话不存在或无权限")
    )
)]
pub(crate) async fn append_message(
    State(state): State<AppState>,
    Path((workspace_id, session_id)): Path<(WorkspaceId, SessionId)>,
    headers: HeaderMap,
    Json(req): Json<AppendMessageRequest>,
) -> Result<Json<SessionMessage>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    get_session_in_workspace(&state, workspace_id, session_id).await?;

    let content = req.content.trim();
    if content.is_empty() {
        return Err(ApiError(BrierError::Validation("content 不能为空".into())));
    }
    let now = Utc::now();
    let created = brier_agent::repository::append_session_message(
        &state.db,
        SessionMessage {
            id: brier_type::id::SessionMessageId::new(),
            session_id,
            role: req.role,
            content: content.to_string(),
            agent_id: req.agent_id,
            task_id: req.task_id,
            created_at: now,
        },
        now,
    )
    .await?;
    Ok(Json(created))
}

#[utoipa::path(
    delete,
    path = "/api/workspaces/{workspace_id}/sessions/{session_id}",
    params(
        ("workspace_id" = WorkspaceId, Path, description = "工作空间 ID"),
        ("session_id" = SessionId, Path, description = "会话 ID")
    ),
    responses(
        (status = 200, description = "删除成功"),
        (status = 401, description = "未登录"),
        (status = 404, description = "会话不存在或无权限")
    )
)]
pub(crate) async fn delete_session(
    State(state): State<AppState>,
    Path((workspace_id, session_id)): Path<(WorkspaceId, SessionId)>,
    headers: HeaderMap,
) -> Result<Json<()>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    get_session_in_workspace(&state, workspace_id, session_id).await?;
    brier_agent::repository::delete_session(&state.db, session_id).await?;
    Ok(Json(()))
}

async fn get_session_in_workspace(
    state: &AppState,
    workspace_id: WorkspaceId,
    session_id: SessionId,
) -> Result<Session, ApiError> {
    let s = brier_agent::repository::get_session(&state.db, session_id)
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("session not found".into())))?;
    if s.workspace_id != workspace_id {
        return Err(ApiError(BrierError::NotFound("session not found".into())));
    }
    Ok(s)
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
