pub mod error;
pub mod routes;
pub mod state;

pub use error::ApiError;
pub use state::AppState;

use axum::Router;

pub fn router(state: AppState) -> Router {
    routes::router().with_state(state)
}
