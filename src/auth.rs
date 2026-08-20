use axum::extract::{Query, State};
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Redirect, Response};
use axum::Json;
use cookie::Cookie;
use hive_core::auth::UserInfo;
use hive_error::HiveError;
use hive_github_auth::GithubAuth;
use serde::Deserialize;

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
            HiveError::Io(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        };
        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}

#[derive(Clone)]
pub struct AppState {
    pub github_auth: GithubAuth,
    pub jwt_secret: String,
    pub frontend_url: Option<String>,
}

#[derive(Deserialize)]
pub struct CallbackParams {
    pub code: String,
}

fn build_cookie_header(token: &str) -> String {
    Cookie::build(("hive_token", token))
        .http_only(true)
        .path("/")
        .max_age(cookie::time::Duration::seconds(86400))
        .to_string()
}

fn clear_cookie_header() -> String {
    Cookie::build(("hive_token", ""))
        .http_only(true)
        .path("/")
        .max_age(cookie::time::Duration::seconds(0))
        .to_string()
}

fn get_token_from_headers(headers: &HeaderMap) -> Option<String> {
    let header = headers.get(header::COOKIE)?;
    let header_str = header.to_str().ok()?;
    Cookie::split_parse(header_str)
        .filter_map(|c| c.ok())
        .find(|c| c.name() == "hive_token")
        .map(|c| c.value().to_string())
}

pub async fn github_login(State(state): State<AppState>) -> Redirect {
    let url = state.github_auth.authorize_url();
    Redirect::to(&url)
}

pub async fn github_callback(
    State(state): State<AppState>,
    Query(params): Query<CallbackParams>,
) -> Result<impl IntoResponse, ApiError> {
    let access_token = state.github_auth.exchange_code(&params.code).await?;
    let user = state.github_auth.get_user(&access_token).await?;
    let jwt = crate::jwt::create_token(&user, &state.jwt_secret)?;

    let redirect_url = state
        .frontend_url
        .as_ref()
        .map(|url| format!("{}/", url))
        .unwrap_or_else(|| "/".to_string());

    let mut response = Redirect::to(&redirect_url);
    response.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&build_cookie_header(&jwt)).unwrap(),
    );
    Ok(response)
}

pub async fn auth_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<UserInfo>, ApiError> {
    let token =
        get_token_from_headers(&headers).ok_or_else(|| ApiError(HiveError::Auth("not logged in".into())))?;
    let claims = crate::jwt::verify_token(&token, &state.jwt_secret)?;

    Ok(Json(UserInfo {
        id: claims.sub,
        login: claims.login,
        name: claims.name,
        email: claims.email,
        avatar_url: claims.avatar_url,
    }))
}

pub async fn logout() -> impl IntoResponse {
    let mut response = Redirect::to("/");
    response.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&clear_cookie_header()).unwrap(),
    );
    response
}
