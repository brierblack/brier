use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use serde::Deserialize;

use brier_error::BrierError;
use brier_type::agent::Agent;
use brier_type::enums::{AgentVisibility, PublicScope};
use brier_type::id::{AgentId, WorkComputerId, WorkspaceId};

use crate::error::ApiError;
use crate::routes::current_user;
use crate::AppState;

#[derive(Deserialize, utoipa::ToSchema)]
pub struct CreateAgentRequest {
    pub name: String,
    pub description: Option<String>,
    pub avatar: Option<String>,
    pub visibility: Option<AgentVisibility>,
    pub public_scope: Option<PublicScope>,
    pub runtime: Option<String>,
    /// 显式模型名；缺省/null = 不指定，由 runtime 自己决定。
    pub model: Option<String>,
    pub work_computer_id: Option<String>,
}

/// Agent 字段级更新（缺省字段保持不变；model 传 null 表示清空为"由 runtime 决定"）。
#[derive(Deserialize, utoipa::ToSchema)]
pub struct UpdateAgentRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub avatar: Option<String>,
    pub visibility: Option<AgentVisibility>,
    pub public_scope: Option<PublicScope>,
    pub runtime: Option<String>,
    /// 显式模型名；null = 清空（由 runtime 决定），缺省 = 保持不变。
    pub model: Option<Option<String>>,
    /// 并发数；缺省 = 保持不变（创建默认 3，创建接口不暴露该字段）。
    pub concurrency: Option<i32>,
    /// 任务执行工作目录（daemon 在该目录 spawn runtime）。
    pub workdir: Option<String>,
    pub work_computer_id: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/workspaces/{workspace_id}/agents",
            get(list_agents).post(create_agent),
        )
        .route(
            "/api/workspaces/{workspace_id}/agents/{agent_id}",
            get(get_agent)
                .delete(delete_agent)
                .patch(update_agent),
        )
}

#[utoipa::path(
    get,
    path = "/api/workspaces/{workspace_id}/agents",
    params(("workspace_id" = WorkspaceId, Path, description = "工作空间 ID")),
    responses(
        (status = 200, description = "Agent 列表", body = [Agent]),
        (status = 401, description = "未登录"),
        (status = 404, description = "空间不存在或无权限")
    )
)]
pub(crate) async fn list_agents(
    State(state): State<AppState>,
    Path(workspace_id): Path<WorkspaceId>,
    headers: HeaderMap,
) -> Result<Json<Vec<Agent>>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let agents = brier_agent::repository::list_agents_by_workspace(&state.db, workspace_id).await?;
    Ok(Json(agents))
}

#[utoipa::path(
    post,
    path = "/api/workspaces/{workspace_id}/agents",
    params(("workspace_id" = WorkspaceId, Path, description = "工作空间 ID")),
    request_body = CreateAgentRequest,
    responses(
        (status = 200, description = "创建成功", body = Agent),
        (status = 401, description = "未登录"),
        (status = 404, description = "空间不存在或无权限")
    )
)]
pub(crate) async fn create_agent(
    State(state): State<AppState>,
    Path(workspace_id): Path<WorkspaceId>,
    headers: HeaderMap,
    Json(req): Json<CreateAgentRequest>,
) -> Result<Json<Agent>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let now = Utc::now();

    // 绑定电脑时校验目标电脑存在且属于当前用户，并冗余电脑名
    let (computer_id, computer_name) = match req.work_computer_id.as_deref() {
        None => (None, None),
        Some(s) => {
            let cid = s
                .parse()
                .map(WorkComputerId)
                .map_err(|_| ApiError(BrierError::Validation("invalid work_computer_id".into())))?;
            let wc = brier_agent::repository::get_work_computer(&state.db, cid)
                .await?
                .ok_or_else(|| ApiError(BrierError::NotFound("work computer not found".into())))?;
            if wc.user_id != user.id {
                return Err(ApiError(BrierError::NotFound("work computer not found".into())));
            }
            (Some(cid), Some(wc.name))
        }
    };

    let agent = Agent {
        id: AgentId::new(),
        workspace_id,
        creator_id: user.id,
        work_computer_id: computer_id,
        work_computer_name: computer_name,
        name: req.name,
        description: req.description,
        avatar: req.avatar,
        status: brier_type::enums::AgentStatus::Offline,
        visibility: req.visibility.unwrap_or(AgentVisibility::Private),
        public_scope: req.public_scope,
        runtime: req.runtime,
        model: req.model,
        concurrency: 3,
        workdir: None,
        last_active: None,
        created_at: now,
        updated_at: now,
    };
    let created = brier_agent::repository::create_agent(&state.db, agent).await?;
    Ok(Json(created))
}

#[utoipa::path(
    get,
    path = "/api/workspaces/{workspace_id}/agents/{agent_id}",
    params(
        ("workspace_id" = WorkspaceId, Path, description = "工作空间 ID"),
        ("agent_id" = AgentId, Path, description = "Agent ID")
    ),
    responses(
        (status = 200, description = "Agent 详情", body = Agent),
        (status = 401, description = "未登录"),
        (status = 404, description = "Agent 不存在或无权限")
    )
)]
pub(crate) async fn get_agent(
    State(state): State<AppState>,
    Path((workspace_id, agent_id)): Path<(WorkspaceId, AgentId)>,
    headers: HeaderMap,
) -> Result<Json<Agent>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let agent = brier_agent::repository::get_agent(&state.db, agent_id)
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("agent not found".into())))?;
    Ok(Json(agent))
}

#[utoipa::path(
    delete,
    path = "/api/workspaces/{workspace_id}/agents/{agent_id}",
    params(
        ("workspace_id" = WorkspaceId, Path, description = "工作空间 ID"),
        ("agent_id" = AgentId, Path, description = "Agent ID")
    ),
    responses(
        (status = 200, description = "删除成功"),
        (status = 401, description = "未登录"),
        (status = 404, description = "Agent 不存在或无权限")
    )
)]
pub(crate) async fn delete_agent(
    State(state): State<AppState>,
    Path((workspace_id, agent_id)): Path<(WorkspaceId, AgentId)>,
    headers: HeaderMap,
) -> Result<Json<()>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    brier_agent::repository::delete_agent(&state.db, agent_id).await?;
    Ok(Json(()))
}

#[utoipa::path(
    patch,
    path = "/api/workspaces/{workspace_id}/agents/{agent_id}",
    params(
        ("workspace_id" = WorkspaceId, Path, description = "工作空间 ID"),
        ("agent_id" = AgentId, Path, description = "Agent ID")
    ),
    request_body = UpdateAgentRequest,
    responses(
        (status = 200, description = "更新成功", body = Agent),
        (status = 401, description = "未登录"),
        (status = 404, description = "Agent 不存在或无权限")
    )
)]
pub(crate) async fn update_agent(
    State(state): State<AppState>,
    Path((workspace_id, agent_id)): Path<(WorkspaceId, AgentId)>,
    headers: HeaderMap,
    Json(req): Json<UpdateAgentRequest>,
) -> Result<Json<Agent>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;

    // 换绑电脑时校验目标电脑存在且属于当前用户，同时取电脑名冗余写入
    let (computer_id, computer_name) = match req.work_computer_id.as_deref() {
        None => (None, None),
        Some(s) => {
            let cid = s
                .parse()
                .map(WorkComputerId)
                .map_err(|_| ApiError(BrierError::Validation("invalid work_computer_id".into())))?;
            let wc = brier_agent::repository::get_work_computer(&state.db, cid)
                .await?
                .ok_or_else(|| ApiError(BrierError::NotFound("work computer not found".into())))?;
            if wc.user_id != user.id {
                return Err(ApiError(BrierError::NotFound("work computer not found".into())));
            }
            (Some(cid), Some(wc.name))
        }
    };

    let updated = brier_agent::repository::update_agent_fields(
        &state.db,
        agent_id,
        brier_agent::repository::AgentUpdate {
            name: req.name,
            description: req.description,
            avatar: req.avatar,
            runtime: req.runtime,
            model: req.model,
            concurrency: req.concurrency,
            workdir: req.workdir,
            visibility: req.visibility,
            public_scope: req.public_scope,
            work_computer_id: computer_id,
            work_computer_name: computer_name,
        },
        Utc::now(),
    )
    .await?
    .ok_or_else(|| ApiError(BrierError::NotFound("agent not found".into())))?;

    // 归属防御：更新目标必须属于该空间
    if updated.workspace_id != workspace_id {
        return Err(ApiError(BrierError::NotFound("agent not found".into())));
    }
    Ok(Json(updated))
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
