//! 上行消息分发：按 `ClientMessage` 类型路由到鉴权或各业务分支处理。

use std::str::FromStr;

use brier_type::enums::TaskStatus;
use brier_type::id::{TaskId, UserId, WorkComputerId, WorkspaceId};
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
            let Some((cid, user_id)) = *computer else { return; };
            let Ok(tid) = TaskId::from_str(&task_id) else { return; };
            // 解析任务所属工作空间：优先走进程内索引（O(1)），索引 miss 时
            // 查库一次并回填（兼容旧版本创建、未登记索引的任务）。
            let Some(workspace_id) = resolve_workspace(ctx, tid, cid).await else {
                return;
            };
            // 输出统一进入批量缓冲，由 writer 周期 flush（一次 DB append + 一次 SSE 事件）
            ctx.output_batcher.push(tid, cid, user_id, workspace_id, &data);
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
                // 终态前置：确保残余输出先落库，再推进任务状态
                ctx.output_batcher.flush_task(&tid).await;
                match brier_agent::repository::finish_task(&ctx.db, tid, cid, exit_code, now).await {
                    Ok(Some(task)) => {
                        ctx.workspaces.remove(&tid);
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
                // 终态前置：确保残余输出先落库，再推进任务状态
                ctx.output_batcher.flush_task(&tid).await;
                match brier_agent::repository::fail_task(&ctx.db, tid, cid, &error, now).await {
                    Ok(Some(task)) => {
                        ctx.workspaces.remove(&tid);
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

/// 解析任务所属工作空间：索引快路径 + 查库回填。
///
/// 仅当任务确属该电脑且仍在执行（pending/running）时才返回并缓存；
/// 终态/非本机任务直接返回 None（对应输出帧会被批量器丢弃，不写库不推送）。
async fn resolve_workspace(
    ctx: &TunnelContext,
    task_id: TaskId,
    computer_id: WorkComputerId,
) -> Option<WorkspaceId> {
    if let Some(ws) = ctx.workspaces.get(&task_id) {
        return Some(ws);
    }
    let task = brier_agent::repository::get_agent_task(&ctx.db, task_id).await.ok()??;
    let is_active = matches!(task.status, TaskStatus::Pending | TaskStatus::Running);
    let belongs = task.computer_id == Some(computer_id);
    if !is_active || !belongs {
        return None;
    }
    ctx.workspaces.insert(task_id, task.workspace_id);
    Some(task.workspace_id)
}
