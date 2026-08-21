use axum::extract::{Query, State};
use axum::http::{header, HeaderMap, HeaderValue};
use axum::response::{IntoResponse, Redirect, Response};
use axum::routing::get;
use axum::Json;
use axum::Router;
use cookie::Cookie;
use hive_core::auth::UserInfo;
use hive_error::HiveError;

use crate::error::ApiError;
use crate::jwt;
use crate::AppState;

#[derive(serde::Deserialize)]
struct CallbackParams {
    code: String,
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

pub(crate) fn get_token_from_headers(headers: &HeaderMap) -> Option<String> {
    let header = headers.get(header::COOKIE)?;
    let header_str = header.to_str().ok()?;
    Cookie::split_parse(header_str)
        .filter_map(|c| c.ok())
        .find(|c| c.name() == "hive_token")
        .map(|c| c.value().to_string())
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/github", get(github_login))
        .route("/github/callback", get(github_callback))
        .route("/me", get(auth_me))
        .route("/logout", get(logout))
}

async fn github_login(State(state): State<AppState>) -> Redirect {
    let url = state.github_auth.authorize_url();
    Redirect::to(&url)
}

async fn github_callback(
    State(state): State<AppState>,
    Query(params): Query<CallbackParams>,
) -> Result<impl IntoResponse, ApiError> {
    let access_token = state.github_auth.exchange_code(&params.code).await?;
    let user = state.github_auth.get_user(&access_token).await?;

    hive_database::repository::upsert_user_by_github_id(
        &state.db,
        user.id as i64,
        &user.login,
        user.name.as_deref(),
        user.email.as_deref(),
        user.avatar_url.as_deref(),
    )
    .await?;

    let jwt = jwt::create_token(&user, &state.jwt_secret)?;

    let redirect_url = state
        .frontend_url
        .as_ref()
        .map(|url| format!("{}/", url))
        .unwrap_or_else(|| "/".to_string());

    let mut response = Redirect::to(&redirect_url).into_response();
    response.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&build_cookie_header(&jwt)).unwrap(),
    );
    Ok(response)
}

async fn auth_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<UserInfo>, ApiError> {
    let token =
        get_token_from_headers(&headers).ok_or_else(|| ApiError(HiveError::Auth("not logged in".into())))?;
    let claims = jwt::verify_token(&token, &state.jwt_secret)?;

    Ok(Json(UserInfo {
        id: claims.sub,
        login: claims.login,
        name: claims.name,
        email: claims.email,
        avatar_url: claims.avatar_url,
    }))
}

async fn logout() -> Response {
    let mut response = Redirect::to("/").into_response();
    response.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&clear_cookie_header()).unwrap(),
    );
    response
}
