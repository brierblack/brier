pub(crate) mod agent;
pub(crate) mod auth;
pub(crate) mod forge;
pub(crate) mod team;
pub(crate) mod tunnel;
pub(crate) mod work_computer;
pub(crate) mod workspace;

use axum::http::HeaderMap;
use axum::routing::get;
use axum::Router;
use brier_error::BrierError;
use brier_type::id::UserId;
use brier_type::User;

use crate::error::ApiError;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .nest("/api/auth", auth::router())
        .nest("/api/workspaces", workspace::router())
        .merge(agent::router())
        .merge(team::router())
        .merge(work_computer::router())
        .route("/api/{provider}/repos", get(forge::list_repos))
        .route("/tunnel", get(tunnel::tunnel_handler))
        .route("/api-docs/openapi.json", get(crate::docs::serve_openapi_json))
}

pub(crate) async fn current_user(state: &AppState, headers: &HeaderMap) -> Result<User, ApiError> {
    let token = auth::get_token_from_headers(headers)
        .ok_or_else(|| ApiError(BrierError::Auth("not logged in".into())))?;
    let claims = state.jwt_verifier.verify(&token)?;
    let user = brier_user::repository::find_user_by_id(&state.db, UserId(claims.sub))
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("user not found".into())))?;
    Ok(user)
}
