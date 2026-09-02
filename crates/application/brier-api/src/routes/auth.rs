use axum::extract::{Path, Query, State};
use axum::http::{header, HeaderMap, HeaderValue};
use axum::response::{IntoResponse, Redirect, Response};
use axum::routing::get;
use axum::Json;
use axum::Router;
use cookie::Cookie;
use brier_contract::auth::OAuthProvider;
use brier_error::BrierError;
use brier_jwt::{SessionClaims, SESSION_TTL_SECS};
use brier_type::id::UserId;
use brier_type::User;

use crate::error::ApiError;
use crate::AppState;

#[derive(serde::Deserialize, utoipa::IntoParams)]
pub(crate) struct CallbackParams {
    /// OAuth 授权码（OAuth 回调携带的 query 参数）。
    code: String,
}

fn build_cookie_header(state: &AppState, token: &str) -> String {
    let mut builder = Cookie::build(("brier_token", token))
        .http_only(true)
        .path("/")
        .max_age(cookie::time::Duration::seconds(SESSION_TTL_SECS as i64))
        .same_site(cookie::SameSite::Lax);
    if state.cookie_secure {
        builder = builder.secure(true);
    }
    builder.to_string()
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
        .route("/{provider}/login", get(provider_login))
        .route("/{provider}/callback", get(provider_callback))
        .route("/me", get(auth_me))
        .route("/logout", get(logout))
}

/// 跳转指定 OAuth 提供方的授权页；未注册的 provider 返回 404。
#[utoipa::path(
    get,
    path = "/api/auth/{provider}/login",
    params(("provider", description = "OAuth 提供方，如 github / gitee")),
    responses(
        (status = 302, description = "跳转到授权页"),
        (status = 404, description = "未知 provider")
    )
)]
pub(crate) async fn provider_login(
    State(state): State<AppState>,
    Path(provider): Path<String>,
) -> Result<Redirect, ApiError> {
    let provider = state
        .providers
        .get_auth(&provider)
        .ok_or_else(|| ApiError(BrierError::NotFound(format!("unknown provider: {provider}"))))?;
    Ok(Redirect::to(&provider.authorize_url()))
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
    let user = brier_user::repository::find_or_create_user_by_identity(
        &state.db,
        &state.token_cipher,
        provider.provider_name(),
        &identity.provider_uid,
        &brier_user::repository::IdentityProfile {
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

/// OAuth 回调：换码 → 取身份 → 查找/创建账户 → 签发会话 Cookie 并跳转前端。
#[utoipa::path(
    get,
    path = "/api/auth/{provider}/callback",
    params(
        ("provider", description = "OAuth 提供方，如 github / gitee"),
        CallbackParams
    ),
    responses(
        (status = 302, description = "登录成功，Set-Cookie 会话令牌并跳转"),
        (status = 401, description = "换码/取身份失败"),
        (status = 404, description = "未知 provider")
    )
)]
pub(crate) async fn provider_callback(
    State(state): State<AppState>,
    Path(provider): Path<String>,
    Query(params): Query<CallbackParams>,
) -> Result<impl IntoResponse, ApiError> {
    let provider_obj = state
        .providers
        .get_auth(&provider)
        .ok_or_else(|| ApiError(BrierError::NotFound(format!("unknown provider: {provider}"))))?;
    let user = oauth_login(&state, provider_obj.as_ref(), &params.code).await?;

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
        HeaderValue::from_str(&build_cookie_header(&state, &jwt)).unwrap(),
    );
    Ok(response)
}

/// 返回当前登录用户信息。
#[utoipa::path(
    get,
    path = "/api/auth/me",
    responses(
        (status = 200, description = "当前用户信息", body = User),
        (status = 401, description = "未登录")
    )
)]
pub(crate) async fn auth_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<User>, ApiError> {
    let token =
        get_token_from_headers(&headers).ok_or_else(|| ApiError(BrierError::Auth("not logged in".into())))?;
    let claims = state.jwt_verifier.verify(&token)?;
    let user = brier_user::repository::find_user_by_id(&state.db, UserId(claims.sub))
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("user not found".into())))?;
    Ok(Json(user))
}

/// 登出：清除会话 Cookie 并跳转首页。
#[utoipa::path(
    get,
    path = "/api/auth/logout",
    responses((status = 302, description = "清除 Cookie 并跳转"))
)]
pub(crate) async fn logout() -> Response {
    let mut response = Redirect::to("/").into_response();
    response.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&clear_cookie_header()).unwrap(),
    );
    response
}
