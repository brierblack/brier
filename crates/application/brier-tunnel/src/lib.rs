//! CLI 隧道 WebSocket 服务（application 层独立 crate）。
//!
//! 从 `brier-api` 路由层剥离出的隧道全链路：接收 CLI（brier-cli daemon）的
//! wss 长连接，完成鉴权（令牌哈希反查 → 按 hostname upsert 电脑 → 注册连接 →
//! AuthOk）、心跳落库、下行消息（TaskStart/TaskCancel）转发、上行任务消息
//! （output/complete/error）落库与事件广播、断连清理（置 offline + 推送事件）。
//!
//! 分层：
//! - [`TunnelContext`]：隧道运行所需依赖（DB / 连接注册表 / 事件总线），
//!   由宿主（`brier-api`）在路由适配处从 `AppState` 映射注入，本 crate 不依赖 HTTP 路由层。
//! - [`transport`]：WebSocket 生命周期主循环（传输层）。
//! - [`auth`]：Auth 消息的鉴权编排。
//! - [`dispatch`]：上行 `ClientMessage` 的分发与各业务分支处理。
//! - [`cleanup`]：断连清理。
//! - 事件工具（本文件）：任务/电脑状态事件的 JSON 序列化与广播，供隧道与 HTTP 路由共用。

pub mod auth;
pub mod cleanup;
pub mod dispatch;
pub mod transport;

pub use transport::tunnel_upgrade;

use brier_core::event_bus::EventBus;
use brier_core::tunnel::ConnectionRegistry;
use brier_type::id::UserId;
use brier_type::{AgentTask, TaskEvent, WorkComputerEvent};
use sea_orm::DatabaseConnection;

/// 隧道运行上下文：`brier-api` 在路由适配处从 `AppState` 提取相关字段构造并注入。
#[derive(Clone)]
pub struct TunnelContext {
    pub db: DatabaseConnection,
    pub tunnel_registry: ConnectionRegistry,
    pub event_bus: EventBus,
}

/// 向用户推送任务状态事件（SSE，无订阅者时静默）。
pub async fn publish_task_event(event_bus: &EventBus, user_id: &UserId, task: &AgentTask) {
    let event = TaskEvent::Updated {
        task_id: task.id,
        workspace_id: task.workspace_id,
        status: task.status,
    };
    if let Ok(payload) = serde_json::to_string(&event) {
        event_bus.publish(user_id.0, payload).await;
    }
}

/// 向用户推送工作电脑状态事件（JSON 字符串；无订阅者时静默）。
pub async fn publish_work_computer_event(
    event_bus: &EventBus,
    user_id: UserId,
    event: WorkComputerEvent,
) {
    if let Ok(payload) = serde_json::to_string(&event) {
        event_bus.publish(user_id.0, payload).await;
    }
}
