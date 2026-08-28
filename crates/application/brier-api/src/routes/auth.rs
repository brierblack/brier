use axum::extract::{Query, State};
use axum::http::{header, HeaderMap, HeaderValue};
use axum::response::{IntoResponse, Redirect, Response};
use axum::routing::get;
use axum::Json;
use axum::Router;
use cookie::Cookie;
use brier_core::auth::OAuthProvider;
use brier_error::BrierError;
use brier_jwt::{SessionClaims, SESSION_TTL_SECS};
use brier_type::id::UserId;
use brier_type::User;

use crate::error::ApiError;
use crate::AppState;

#[derive(serde::Deserialize)]
struct CallbackParams {
    code: String,
}

fn build_cookie_header(token: &str) -> String {
    Cookie::build(("brier_token", token))
        .http_only(true)
        .path("/")
        .max_age(cookie::time::Duration::seconds(SESSION_TTL_SECS as i64))
        .to_string()
}

fn clear_cookie_header() -> String {
    Cookie::build(("brier_token", ""))
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
        .find(|c| c.name() == "brier_token")
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
    Redirect::to(&state.github_auth.authorize_url())
}

/// 统一 OAuth 登录编排：换码 → 取身份 → 查找/创建账户。
/// 接入新 Provider（Gitee/GitLab 等）时复用本函数，无需重写登录流程。
pub(crate) async fn oauth_login(
    state: &AppState,
    provider: &dyn OAuthProvider,
    code: &str,
) -> Result<User, ApiError> {
    let access_token = provider.exchange_code(code).await?;
    let identity = provider.fetch_identity(&access_token).await?;
    let user = brier_database::repository::find_or_create_user_by_identity(
        &state.db,
        provider.provider_name(),
        &identity.provider_uid,
        &brier_database::repository::IdentityProfile {
            username: &identity.username,
            name: identity.name.as_deref(),
            email: identity.email.as_deref(),
            avatar_url: identity.avatar_url.as_deref(),
        },
        Some(&access_token),
    )
    .await?;
    Ok(user)
}

async fn github_callback(
    State(state): State<AppState>,
    Query(params): Query<CallbackParams>,
) -> Result<impl IntoResponse, ApiError> {
    let user = oauth_login(&state, &state.github_auth, &params.code).await?;

    let claims = SessionClaims::new(user.id.0)?;
    let jwt = state.jwt_signer.sign(&claims)?;

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
) -> Result<Json<User>, ApiError> {
    let token =
        get_token_from_headers(&headers).ok_or_else(|| ApiError(BrierError::Auth("not logged in".into())))?;
    let claims = state.jwt_verifier.verify(&token)?;
    let user = brier_database::repository::find_user_by_id(&state.db, UserId(claims.sub))
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("user not found".into())))?;
    Ok(Json(user))
}

async fn logout() -> Response {
    let mut response = Redirect::to("/").into_response();
    response.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&clear_cookie_header()).unwrap(),
    );
    response
}
