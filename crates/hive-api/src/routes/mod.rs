mod auth;

use axum::Router;

use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new().nest("/api/auth", auth::router())
}
