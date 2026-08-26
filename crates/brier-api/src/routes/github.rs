use axum::extract::State;
use axum::http::HeaderMap;
use axum::routing::get;
use axum::Json;
use axum::Router;
use brier_github_auth::RepoInfo;

use crate::error::ApiError;
use crate::routes::current_user;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/repos", get(list_repos))
}

async fn list_repos(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<RepoInfo>>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let token = brier_database::repository::get_github_token(&state.db, user.id)
        .await?
        .ok_or_else(|| ApiError(brier_error::BrierError::Auth("github token not found".into())))?;
    let repos = state.github_auth.list_repos(&token).await?;
    Ok(Json(repos))
}
