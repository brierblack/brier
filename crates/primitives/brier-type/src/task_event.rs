//! Agent 任务实时事件（经 SSE 推送给前端）。
//!
//! 事件语义：任务创建开始执行 / 状态变更（完成、失败、取消）时推送，
//! 前端收到后刷新任务列表或详情；高频输出不推送（详情页轮询拉取），
//! 避免事件风暴。

use serde::{Deserialize, Serialize};

use crate::enums::TaskStatus;
use crate::id::{TaskId, WorkspaceId};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum TaskEvent {
    #[serde(rename = "task_updated")]
    Updated {
        task_id: TaskId,
        workspace_id: WorkspaceId,
        status: TaskStatus,
    },
}
