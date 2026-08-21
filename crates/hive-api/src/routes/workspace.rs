use axum::extract::State;
use axum::http::HeaderMap;
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use hive_type::id::WorkspaceId;
use hive_type::Workspace;
use serde::Deserialize;

use crate::error::ApiError;
use crate::routes::current_user;
use crate::AppState;

#[derive(Deserialize)]
struct CreateWorkspaceRequest {
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
}

async fn create_workspace(
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
    let created = hive_database::repository::create_workspace(&state.db, workspace).await?;
    Ok(Json(created))
}

async fn list_workspaces(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Workspace>>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let workspaces =
        hive_database::repository::list_workspaces_for_user(&state.db, user.id).await?;
    Ok(Json(workspaces))
}
