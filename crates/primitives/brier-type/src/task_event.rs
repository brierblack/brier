//! Agent 任务实时事件（经 SSE 推送给前端）。
//!
//! 事件语义：
//! - [`TaskEvent::Updated`]：任务状态变更（创建 / 完成 / 失败 / 取消），前端收到后刷新列表或详情；
//! - [`TaskEvent::Output`]：任务输出增量块（stdout/stderr 按到达顺序分批），
//!   前端收到后追加到输出区，替代详情页轮询拉取全量输出。
//!
//! 事件按用户广播；SSE 端点可按 `workspace_id` 过滤，只推送当前会话（工作空间）的任务事件。

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
    #[serde(rename = "task_output")]
    Output {
        task_id: TaskId,
        workspace_id: WorkspaceId,
        /// 本块在任务累计输出中的起始偏移（字节），供前端快照增量去重/补缺。
        offset: usize,
        /// 输出增量块（已按 CLI 侧 16KB/50ms 微批，非逐字符）。
        data: String,
    },
}
