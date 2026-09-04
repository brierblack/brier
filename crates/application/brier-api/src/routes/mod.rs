pub(crate) mod agent;
pub(crate) mod agent_task;
pub(crate) mod auth;
pub(crate) mod forge;
pub(crate) mod session;
pub(crate) mod team;
pub(crate) mod work_computer;
pub(crate) mod workspace;
use axum::extract::ws::WebSocketUpgrade;
use axum::extract::State;
use axum::http::HeaderMap;
use axum::response::Response;
use axum::routing::get;
use axum::Router;
use brier_error::BrierError;
use brier_tunnel::TunnelContext;
use brier_type::id::UserId;
use brier_type::User;

use crate::error::ApiError;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .nest("/api/auth", auth::router())
        .nest("/api/workspaces", workspace::router())
        .merge(agent::router())
        .merge(agent_task::router())
        .merge(session::router())
        .merge(team::router())
        .merge(work_computer::router())
        .route("/api/{provider}/repos", get(forge::list_repos))
        .route("/tunnel", get(tunnel_ws))
        .route("/api-docs/openapi.json", get(crate::docs::serve_openapi_json))
}

/// WebSocket 隧道入口适配：把 HTTP 路由层的 `AppState` 映射为隧道运行上下文，
/// 实际处理（鉴权/心跳/任务消息/断连清理）在 `brier-tunnel` crate 内完成。
async fn tunnel_ws(
    ws: WebSocketUpgrade,
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Response {
    brier_tunnel::tunnel_upgrade(
        ws,
        headers,
        TunnelContext {
            db: state.db,
            tunnel_registry: state.tunnel_registry,
            event_bus: state.event_bus,
        },
    )
    .await
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
