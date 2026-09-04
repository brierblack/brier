//! 鉴权编排：处理 `ClientMessage::Auth`——令牌校验、电脑 upsert、连接注册与应答。

use brier_type::id::{UserId, WorkComputerId};
use brier_type::tunnel::{ClientMessage, ServerMessage};
use brier_type::WorkComputerEvent;
use chrono::Utc;
use tokio::sync::mpsc;

use crate::publish_work_computer_event;
use crate::TunnelContext;

/// 处理 Auth 消息（整条消息传入，内部按 Auth 变体解构）。
pub(super) async fn handle_auth(
    ctx: &TunnelContext,
    tx: &mpsc::UnboundedSender<ServerMessage>,
    token_hash: &str,
    computer: &mut Option<(WorkComputerId, UserId)>,
    msg: ClientMessage,
) {
    let ClientMessage::Auth {
        hostname,
        os,
        runtimes,
        version,
        ..
    } = msg
    else {
        // 仅由 dispatch 在匹配 Auth 变体后调用，理论上不可达
        return;
    };

    if computer.is_some() {
        tracing::info!(hostname, "duplicate auth ignored");
        return;
    }

    // 1. 令牌鉴权：哈希反查用户
    let user_id = match brier_agent::repository::find_user_by_connect_token(&ctx.db, token_hash)
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
        &ctx.db,
        user_id,
        &hostname,
        &os,
        Some(&runtimes),
        version.as_deref(),
        now,
    )
    .await
    {
        Ok(model) => {
            let cid = WorkComputerId(model.id);
            ctx.tunnel_registry
                .register(&cid.to_string(), tx.clone())
                .await;
            *computer = Some((cid, user_id));
            let _ = tx.send(ServerMessage::AuthOk {
                computer_id: cid.to_string(),
            });
            tracing::info!(
                user_id = %user_id, computer_id = %cid, hostname,
                "work computer authenticated"
            );
            publish_work_computer_event(
                &ctx.event_bus,
                user_id,
                WorkComputerEvent::Updated { computer_id: cid },
            )
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
