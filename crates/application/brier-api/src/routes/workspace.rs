use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use brier_error::BrierError;
use brier_type::id::WorkspaceId;
use brier_type::Workspace;
use serde::Deserialize;

use crate::error::ApiError;
use crate::routes::current_user;
use crate::AppState;

#[derive(Deserialize, utoipa::ToSchema)]
pub(crate) struct CreateWorkspaceRequest {
    name: String,
    slug: String,
    description: Option<String>,
    avatar: Option<String>,
    instructions: Option<String>,
    repositories: Option<Vec<String>>,
    auto_pr_review: Option<bool>,
    auto_issue_assign: Option<bool>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_workspaces).post(create_workspace))
        .route("/{workspace_id}", get(get_workspace))
}

/// 获取工作空间详情（需登录 + 空间成员或创建者）。
#[utoipa::path(
    get,
    path = "/api/workspaces/{workspace_id}",
    params(("workspace_id" = WorkspaceId, Path, description = "工作空间 ID")),
    responses(
        (status = 200, description = "工作空间详情", body = Workspace),
        (status = 401, description = "未登录"),
        (status = 404, description = "空间不存在或无权限")
    )
)]
pub(crate) async fn get_workspace(
    State(state): State<AppState>,
    Path(workspace_id): Path<WorkspaceId>,
    headers: HeaderMap,
) -> Result<Json<Workspace>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let workspace =
        brier_workspace::repository::get_workspace_for_user(&state.db, &workspace_id, &user.id)
            .await?
            .ok_or_else(|| ApiError(BrierError::NotFound("workspace not found".into())))?;
    Ok(Json(workspace))
}

/// 创建空间（需登录）。
#[utoipa::path(
    post,
    path = "/api/workspaces",
    request_body = CreateWorkspaceRequest,
    responses(
        (status = 200, description = "创建成功，返回空间", body = Workspace),
        (status = 401, description = "未登录"),
        (status = 400, description = "请求体不合法")
    )
)]
pub(crate) async fn create_workspace(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<CreateWorkspaceRequest>,
) -> Result<Json<Workspace>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let now = Utc::now();
    let workspace = Workspace {
        id: WorkspaceId::new(),
        creator_id: user.id,
        name: req.name,
        slug: req.slug,
        description: req.description,
        avatar: req.avatar,
        instructions: req.instructions,
        repositories: req.repositories.unwrap_or_default(),
        auto_pr_review: req.auto_pr_review.unwrap_or(false),
        auto_issue_assign: req.auto_issue_assign.unwrap_or(false),
        created_at: now,
        updated_at: now,
    };
    let created = brier_workspace::repository::create_workspace(&state.db, workspace).await?;
    Ok(Json(created))
}

/// 列出当前用户的全部空间（需登录）。
#[utoipa::path(
    get,
    path = "/api/workspaces",
    responses(
        (status = 200, description = "空间列表", body = [Workspace]),
        (status = 401, description = "未登录")
    )
)]
pub(crate) async fn list_workspaces(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Workspace>>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let workspaces =
        brier_workspace::repository::list_workspaces_for_user(&state.db, user.id).await?;
    Ok(Json(workspaces))
}
