//! 工作电脑实时状态事件（经 SSE 推送给前端）。
//!
//! 事件语义：
//! - `Updated`：电脑上线 / 心跳状态变化 / 手动创建，前端应刷新列表
//! - `Deleted`：电脑被删除，前端应移除该项并刷新
//! 前端收到事件后拉取一次列表（事件驱动），替代定时轮询。

use serde::{Deserialize, Serialize};

use crate::id::WorkComputerId;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WorkComputerEvent {
    Updated {
        computer_id: WorkComputerId,
    },
    Deleted {
        computer_id: WorkComputerId,
    },
}
