//! 领域状态核心。
//!
//! 存放**领域状态与运行时对象**，不含行为契约（契约见 `brier-contract`）。
//! - `tunnel::ConnectionRegistry`：CLI 隧道实时连接注册表
//! - `event_bus::EventBus`：每用户 SSE 事件广播（工作电脑状态变更推送）

pub mod event_bus;
pub mod tunnel;
