use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use hive_error::HiveError;

pub struct ApiError(pub HiveError);

impl From<HiveError> for ApiError {
    fn from(e: HiveError) -> Self {
        Self(e)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match &self.0 {
            HiveError::Config(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            HiveError::Auth(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            HiveError::GithubApi(msg) => (StatusCode::BAD_GATEWAY, msg.clone()),
            HiveError::Jwt(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            HiveError::Server(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            HiveError::Database(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            HiveError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            HiveError::Validation(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            HiveError::Io(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            HiveError::Db(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        };
        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}
