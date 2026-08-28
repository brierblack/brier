use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use brier_error::BrierError;

pub struct ApiError(pub BrierError);

impl From<BrierError> for ApiError {
    fn from(e: BrierError) -> Self {
        Self(e)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match &self.0 {
            BrierError::Config(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            BrierError::Auth(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            BrierError::Provider(msg) => (StatusCode::BAD_GATEWAY, msg.clone()),
            BrierError::Jwt(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            BrierError::Server(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            BrierError::Database(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            BrierError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            BrierError::Validation(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            BrierError::Io(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        };
        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}
