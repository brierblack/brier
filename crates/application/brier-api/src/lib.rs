pub mod docs;
pub mod error;
pub mod routes;
pub mod state;

pub use error::ApiError;
pub use state::AppState;

use axum::Router;
use utoipa_swagger_ui::{Config, SwaggerUi};

pub fn router(state: AppState) -> Router {
    // spec JSON 由 routes::router() 提供（/api-docs/openapi.json），
    // SwaggerUi 仅挂载 /docs 页面并指向该 spec 地址。
    let swagger_config = Config::new(["/api-docs/openapi.json"]);
    routes::router()
        .merge(SwaggerUi::new("/docs").config(swagger_config))
        .with_state(state)
}
