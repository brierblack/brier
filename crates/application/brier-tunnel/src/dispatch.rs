//! 上行消息分发：按 `ClientMessage` 类型路由到鉴权或各业务分支处理。

use std::str::FromStr;

use brier_type::id::{TaskId, UserId, WorkComputerId};
use brier_type::tunnel::{ClientMessage, ServerMessage};
use chrono::Utc;
use tokio::sync::mpsc;

use crate::publish_task_event;
use crate::TunnelContext;
use super::auth::handle_auth;

#[allow(clippy::too_many_arguments)]
pub(super) async fn handle_client_message(
    ctx: &TunnelContext,
    tx: &mpsc::UnboundedSender<ServerMessage>,
    token_hash: &str,
    computer: &mut Option<(WorkComputerId, UserId)>,
    msg: ClientMessage,
) {
    match msg {
        ClientMessage::Auth { .. } => handle_auth(ctx, tx, token_hash, computer, msg).await,
        ClientMessage::Heartbeat { timestamp } => {
            if let Some((cid, _)) = *computer {
                let now = Utc::now();
                if let Err(e) =
                    brier_agent::repository::touch_work_computer_heartbeat(&ctx.db, cid, now).await
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
            tracing::debug!(task_id, ?stream, data_len = data.len(), "task output");
            if let Some((cid, _)) = *computer {
                let Ok(tid) = TaskId::from_str(&task_id) else {
                    return;
                };
                let now = Utc::now();
                if let Err(e) =
                    brier_agent::repository::append_task_output(&ctx.db, tid, cid, &data, now).await
                {
                    tracing::warn!(task_id, error = %e, "append task output failed");
                }
            }
        }
        ClientMessage::TaskComplete {
            task_id,
            exit_code,
        } => {
            tracing::info!(task_id, exit_code, "task completed");
            if let Some((cid, user_id)) = *computer {
                let Ok(tid) = TaskId::from_str(&task_id) else {
                    return;
                };
                let now = Utc::now();
                match brier_agent::repository::finish_task(&ctx.db, tid, cid, exit_code, now).await {
                    Ok(Some(task)) => {
                        let _ =
                            brier_agent::repository::touch_agent_activity(&ctx.db, task.agent_id, now)
                                .await;
                        publish_task_event(&ctx.event_bus, &user_id, &task).await;
                    }
                    Ok(None) => {
                        // 任务已终态（如已取消）或非本机任务，忽略
                    }
                    Err(e) => tracing::warn!(task_id, error = %e, "finish task failed"),
                }
            }
        }
        ClientMessage::TaskError { task_id, error } => {
            tracing::warn!(task_id, error, "task error");
            if let Some((cid, user_id)) = *computer {
                let Ok(tid) = TaskId::from_str(&task_id) else {
                    return;
                };
                let now = Utc::now();
                match brier_agent::repository::fail_task(&ctx.db, tid, cid, &error, now).await {
                    Ok(Some(task)) => {
                        let _ =
                            brier_agent::repository::touch_agent_activity(&ctx.db, task.agent_id, now)
                                .await;
                        publish_task_event(&ctx.event_bus, &user_id, &task).await;
                    }
                    Ok(None) => {}
                    Err(e) => tracing::warn!(task_id, error = %e, "fail task failed"),
                }
            }
        }
        ClientMessage::RuntimeInfo { runtimes } => {
            tracing::info!(?runtimes, "runtime info updated");
        }
    }
}
