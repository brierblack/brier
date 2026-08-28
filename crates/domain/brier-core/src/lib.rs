//! 领域状态核心。
//!
//! 存放**领域状态与运行时对象**，不含行为契约（契约见 `brier-contract`）。
//! 当前仅含 `tunnel::ConnectionRegistry`（实时连接注册表）。

pub mod tunnel;
