use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use serde::Deserialize;

use brier_error::BrierError;
use brier_type::agent::Agent;
use brier_type::enums::{AgentVisibility, PublicScope};
use brier_type::id::{AgentId, WorkspaceId};

use crate::error::ApiError;
use crate::routes::current_user;
use crate::AppState;

#[derive(Deserialize, utoipa::ToSchema)]
pub struct CreateAgentRequest {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub visibility: Option<AgentVisibility>,
    pub public_scope: Option<PublicScope>,
    pub runtime: Option<String>,
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
            get(get_agent).delete(delete_agent),
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
    let agent = Agent {
        id: AgentId::new(),
        workspace_id,
        creator_id: user.id,
        work_computer_id: req.work_computer_id.and_then(|s| s.parse().ok()).map(brier_type::id::WorkComputerId),
        name: req.name,
        description: req.description,
        icon: req.icon,
        color: req.color,
        status: brier_type::enums::AgentStatus::Offline,
        visibility: req.visibility.unwrap_or(AgentVisibility::Private),
        public_scope: req.public_scope,
        runtime: req.runtime,
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
