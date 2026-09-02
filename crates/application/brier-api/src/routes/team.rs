use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use serde::Deserialize;

use brier_error::BrierError;
use brier_type::agent_team::AgentTeam;
use brier_type::enums::TeamMode;
use brier_type::id::{AgentId, AgentTeamId, WorkspaceId};

use crate::error::ApiError;
use crate::routes::current_user;
use crate::AppState;

#[derive(Deserialize, utoipa::ToSchema)]
pub struct CreateTeamRequest {
    pub name: String,
    pub description: Option<String>,
    pub mode: Option<TeamMode>,
    pub primary_agent_id: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/workspaces/{workspace_id}/teams",
            get(list_teams).post(create_team),
        )
        .route(
            "/api/workspaces/{workspace_id}/teams/{team_id}",
            get(get_team),
        )
}

#[utoipa::path(
    get,
    path = "/api/workspaces/{workspace_id}/teams",
    params(("workspace_id" = WorkspaceId, Path, description = "工作空间 ID")),
    responses(
        (status = 200, description = "Team 列表", body = [AgentTeam]),
        (status = 401, description = "未登录"),
        (status = 404, description = "空间不存在或无权限")
    )
)]
pub(crate) async fn list_teams(
    State(state): State<AppState>,
    Path(workspace_id): Path<WorkspaceId>,
    headers: HeaderMap,
) -> Result<Json<Vec<AgentTeam>>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let teams = brier_agent::repository::list_teams_by_workspace(&state.db, workspace_id).await?;
    Ok(Json(teams))
}

#[utoipa::path(
    post,
    path = "/api/workspaces/{workspace_id}/teams",
    params(("workspace_id" = WorkspaceId, Path, description = "工作空间 ID")),
    request_body = CreateTeamRequest,
    responses(
        (status = 200, description = "创建成功", body = AgentTeam),
        (status = 401, description = "未登录"),
        (status = 404, description = "空间不存在或无权限")
    )
)]
pub(crate) async fn create_team(
    State(state): State<AppState>,
    Path(workspace_id): Path<WorkspaceId>,
    headers: HeaderMap,
    Json(req): Json<CreateTeamRequest>,
) -> Result<Json<AgentTeam>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let now = Utc::now();
    let team = AgentTeam {
        id: AgentTeamId::new(),
        workspace_id,
        creator_id: user.id,
        primary_agent_id: req.primary_agent_id.and_then(|s| s.parse().ok()).map(AgentId),
        name: req.name,
        description: req.description,
        mode: req.mode.unwrap_or(TeamMode::Coordinator),
        status: brier_type::enums::TeamStatus::Available,
        created_at: now,
        updated_at: now,
    };
    let created = brier_agent::repository::create_team(&state.db, team).await?;
    Ok(Json(created))
}

#[utoipa::path(
    get,
    path = "/api/workspaces/{workspace_id}/teams/{team_id}",
    params(
        ("workspace_id" = WorkspaceId, Path, description = "工作空间 ID"),
        ("team_id" = AgentTeamId, Path, description = "Team ID")
    ),
    responses(
        (status = 200, description = "Team 详情", body = AgentTeam),
        (status = 401, description = "未登录"),
        (status = 404, description = "Team 不存在或无权限")
    )
)]
pub(crate) async fn get_team(
    State(state): State<AppState>,
    Path((workspace_id, team_id)): Path<(WorkspaceId, AgentTeamId)>,
    headers: HeaderMap,
) -> Result<Json<AgentTeam>, ApiError> {
    let user = current_user(&state, &headers).await?;
    check_workspace_access(&state, &workspace_id, &user.id).await?;
    let team = brier_agent::repository::get_team(&state.db, team_id)
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("team not found".into())))?;
    Ok(Json(team))
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
