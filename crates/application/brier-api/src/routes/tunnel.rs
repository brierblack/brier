use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use brier_crypto::hash_token;
use brier_type::id::{UserId, WorkComputerId};
use brier_type::tunnel::{ClientMessage, ServerMessage};
use brier_type::WorkComputerEvent;
use chrono::Utc;
use futures::{SinkExt, StreamExt};
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

/// 隧道主循环：先收 Auth 鉴权（令牌哈希反查用户 → 按 hostname upsert 电脑 →
/// 注册连接 → 回 AuthOk），之后心跳落库 + 转发下行；断开时置 offline。
async fn handle_connection(socket: WebSocket, state: AppState, token: String) {
    let (mut sender, mut receiver) = socket.split();

    let (tx, mut rx) = mpsc::unbounded_channel::<ServerMessage>();
    let token_hash = hash_token(&token);
    // 鉴权通过前不占用 registry；(computer_id, user_id) 供断开清理与事件推送
    let mut computer: Option<(WorkComputerId, UserId)> = None;

    loop {
        tokio::select! {
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                            handle_client_message(&state, &tx, &token_hash, &mut computer, client_msg).await;
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

    if let Some((cid, user_id)) = computer {
        state.tunnel_registry.unregister(&cid.to_string(), &tx).await;
        // 顶号场景：同 key 已被新连接持有时不置 offline、不推事件
        if !state.tunnel_registry.is_online(&cid.to_string()).await {
            if let Err(e) =
                brier_agent::repository::mark_work_computer_offline(&state.db, cid).await
            {
                tracing::warn!(computer_id = %cid, error = %e, "failed to mark work computer offline");
            }
            publish_wc_event(&state, user_id, WorkComputerEvent::Updated { computer_id: cid })
                .await;
        }
        tracing::info!(computer_id = %cid, "work computer tunnel disconnected");
    }
}

/// 向用户推送工作电脑状态事件（JSON 字符串；无订阅者时静默）。
async fn publish_wc_event(state: &AppState, user_id: UserId, event: WorkComputerEvent) {
    if let Ok(payload) = serde_json::to_string(&event) {
        state.event_bus.publish(user_id.0, payload).await;
    }
}

#[allow(clippy::too_many_arguments)]
async fn handle_client_message(
    state: &AppState,
    tx: &mpsc::UnboundedSender<ServerMessage>,
    token_hash: &str,
    computer: &mut Option<(WorkComputerId, UserId)>,
    msg: ClientMessage,
) {
    match msg {
        ClientMessage::Auth {
            hostname,
            os,
            runtimes,
            ..
        } => {
            if computer.is_some() {
                tracing::info!(hostname, "duplicate auth ignored");
                return;
            }

            // 1. 令牌鉴权：哈希反查用户
            let user_id =
                match brier_agent::repository::find_user_by_connect_token(&state.db, token_hash)
                    .await
                {
                    Ok(Some(uid)) => uid,
                    Ok(None) => {
                        tracing::warn!(hostname, "connect token not found");
                        let _ = tx.send(ServerMessage::AuthFailed {
                            reason: "invalid token".into(),
                        });
                        return;
                    }
                    Err(e) => {
                        tracing::error!(error = %e, "connect token lookup failed");
                        let _ = tx.send(ServerMessage::AuthFailed {
                            reason: "internal error".into(),
                        });
                        return;
                    }
                };

            // 2. 按 hostname upsert 电脑（首连创建 / 重连更新），置 online
            let now = Utc::now();
            match brier_agent::repository::upsert_online_work_computer(
                &state.db,
                user_id,
                &hostname,
                &os,
                Some(&runtimes),
                now,
            )
            .await
            {
                Ok(model) => {
                    let cid = WorkComputerId(model.id);
                    state.tunnel_registry.register(&cid.to_string(), tx.clone()).await;
                    *computer = Some((cid, user_id));
                    let _ = tx.send(ServerMessage::AuthOk {
                        computer_id: cid.to_string(),
                    });
                    tracing::info!(
                        user_id = %user_id, computer_id = %cid, hostname,
                        "work computer authenticated"
                    );
                    publish_wc_event(&state, user_id, WorkComputerEvent::Updated { computer_id: cid })
                        .await;
                }
                Err(e) => {
                    tracing::error!(error = %e, "work computer upsert failed");
                    let _ = tx.send(ServerMessage::AuthFailed {
                        reason: "internal error".into(),
                    });
                }
            }
        }
        ClientMessage::Heartbeat { timestamp } => {
            if let Some((cid, _)) = *computer {
                let now = Utc::now();
                if let Err(e) =
                    brier_agent::repository::touch_work_computer_heartbeat(&state.db, cid, now)
                        .await
                {
                    tracing::warn!(computer_id = %cid, error = %e, "heartbeat persist failed");
                }
                let _ = tx.send(ServerMessage::HeartbeatAck { timestamp });
            }
        }
        ClientMessage::TaskOutput {
            task_id,
            stream,
            data,
        } => {
            tracing::info!(task_id, ?stream, data_len = data.len(), "task output");
        }
        ClientMessage::TaskComplete {
            task_id,
            exit_code,
        } => {
            tracing::info!(task_id, exit_code, "task completed");
        }
        ClientMessage::TaskError { task_id, error } => {
            tracing::warn!(task_id, error, "task error");
        }
        ClientMessage::RuntimeInfo { runtimes } => {
            tracing::info!(?runtimes, "runtime info updated");
        }
    }
}
