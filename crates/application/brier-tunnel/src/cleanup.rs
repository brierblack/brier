//! 断连清理：注销连接、置电脑 offline 并推送状态事件。

use brier_core::tunnel::ConnectionSender;
use brier_type::id::{UserId, WorkComputerId};
use brier_type::WorkComputerEvent;

use crate::publish_work_computer_event;
use crate::TunnelContext;

/// 连接断开后的清理：仅当该 key 仍由本连接持有时注销（顶号场景不误删新连接）；
/// 注销后电脑不再在线则置 offline 并推送事件。
pub(super) async fn handle_disconnect(
    ctx: &TunnelContext,
    computer: Option<(WorkComputerId, UserId)>,
    tx: &ConnectionSender,
) {
    if let Some((cid, user_id)) = computer {
        ctx.tunnel_registry.unregister(&cid.to_string(), tx).await;
        // 顶号场景：同 key 已被新连接持有时不置 offline、不推事件
        if !ctx.tunnel_registry.is_online(&cid.to_string()).await {
            if let Err(e) =
                brier_agent::repository::mark_work_computer_offline(&ctx.db, cid).await
            {
                tracing::warn!(computer_id = %cid, error = %e, "failed to mark work computer offline");
            }
            publish_work_computer_event(
                &ctx.event_bus,
                user_id,
                WorkComputerEvent::Updated { computer_id: cid },
            )
            .await;
        }
        tracing::info!(computer_id = %cid, "work computer tunnel disconnected");
    }
}
