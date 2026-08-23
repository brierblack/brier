mod auth;
mod github;
mod workspace;

use axum::http::HeaderMap;
use axum::Router;
use hive_error::HiveError;
use hive_type::User;

use crate::error::ApiError;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .nest("/api/auth", auth::router())
        .nest("/api/workspaces", workspace::router())
        .nest("/api/github", github::router())
}

pub(crate) async fn current_user(state: &AppState, headers: &HeaderMap) -> Result<User, ApiError> {
    let token = auth::get_token_from_headers(headers)
        .ok_or_else(|| ApiError(HiveError::Auth("not logged in".into())))?;
    let claims = crate::jwt::verify_token(&token, &state.jwt_secret)?;
    let user = hive_database::repository::find_user_by_github_id(&state.db, claims.sub as i64)
        .await?
        .ok_or_else(|| ApiError(HiveError::NotFound("user not found".into())))?;
    Ok(user)
}
