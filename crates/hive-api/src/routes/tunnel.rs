use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use futures::{SinkExt, StreamExt};
use hive_type::tunnel::{ClientMessage, ServerMessage};
use tokio::sync::mpsc;

use crate::AppState;

fn extract_token(headers: &HeaderMap) -> Option<String> {
    headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty())
}

pub async fn tunnel_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    headers: HeaderMap,
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

    ws.on_upgrade(move |socket| handle_connection(socket, state, token))
}

async fn handle_connection(socket: WebSocket, state: AppState, token: String) {
    let (mut sender, mut receiver) = socket.split();

    let (tx, mut rx) = mpsc::unbounded_channel::<ServerMessage>();
    state.tunnel_registry.register(&token, tx).await;

    tracing::info!(token = %token, "tunnel connected");

    loop {
        tokio::select! {
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                            handle_client_message(&state, &token, client_msg).await;
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

    state.tunnel_registry.unregister(&token).await;
    tracing::info!(token = %token, "tunnel disconnected");
}

async fn handle_client_message(_state: &AppState, token: &str, msg: ClientMessage) {
    match msg {
        ClientMessage::Auth {
            token: _,
            hostname,
            os,
            runtimes,
        } => {
            tracing::info!(token, hostname, os, ?runtimes, "work computer authenticated");
        }
        ClientMessage::Heartbeat { timestamp } => {
            tracing::trace!(token, timestamp, "heartbeat received");
        }
        ClientMessage::TaskOutput {
            task_id,
            stream,
            data,
        } => {
            tracing::info!(token, task_id, ?stream, data_len = data.len(), "task output");
        }
        ClientMessage::TaskComplete {
            task_id,
            exit_code,
        } => {
            tracing::info!(token, task_id, exit_code, "task completed");
        }
        ClientMessage::TaskError { task_id, error } => {
            tracing::warn!(token, task_id, error, "task error");
        }
        ClientMessage::RuntimeInfo { runtimes } => {
            tracing::info!(token, ?runtimes, "runtime info updated");
        }
    }
}
