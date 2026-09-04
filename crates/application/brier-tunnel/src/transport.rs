//! WebSocket 传输层：连接升级、鉴权头提取与隧道主循环。

use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use brier_type::id::{UserId, WorkComputerId};
use brier_type::tunnel::{ClientMessage, ServerMessage};
use futures::{SinkExt, StreamExt};
use tokio::sync::mpsc;

use super::cleanup::handle_disconnect;
use super::dispatch::handle_client_message;
use super::TunnelContext;

fn extract_token(headers: &HeaderMap) -> Option<String> {
    headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty())
}

/// WebSocket 升级入口：校验 Authorization 头后进入隧道主循环。
pub async fn tunnel_upgrade(
    ws: WebSocketUpgrade,
    headers: HeaderMap,
    ctx: TunnelContext,
) -> Response {
    let token = match extract_token(&headers) {
        Some(t) => t,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                "missing or invalid token",
            )
                .into_response()
        }
    };

    ws.on_upgrade(move |socket| handle_connection(socket, ctx, token))
}

/// 隧道主循环：先收 Auth 鉴权（令牌哈希反查用户 → 按 hostname upsert 电脑 →
/// 注册连接 → 回 AuthOk），之后心跳落库 + 转发下行；断开时清理。
async fn handle_connection(socket: WebSocket, ctx: TunnelContext, token: String) {
    let (mut sender, mut receiver) = socket.split();

    let (tx, mut rx) = mpsc::unbounded_channel::<ServerMessage>();
    let token_hash = brier_crypto::hash_token(&token);
    // 鉴权通过前不占用 registry；(computer_id, user_id) 供断开清理与事件推送
    let mut computer: Option<(WorkComputerId, UserId)> = None;

    loop {
        tokio::select! {
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                            handle_client_message(&ctx, &tx, &token_hash, &mut computer, client_msg).await;
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    _ => {}
                }
            }
            server_msg = rx.recv() => {
                match server_msg {
                    Some(msg) => {
                        match serde_json::to_string(&msg) {
                            Ok(json) => {
                                if sender.send(Message::Text(json.into())).await.is_err() {
                                    break;
                                }
                            }
                            Err(e) => {
                                tracing::error!("failed to serialize server message: {e}");
                            }
                        }
                    }
                    None => break,
                }
            }
        }
    }

    handle_disconnect(&ctx, computer, &tx).await;
}
