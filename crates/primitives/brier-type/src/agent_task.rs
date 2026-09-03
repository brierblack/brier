use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::enums::{TaskPriority, TaskSource, TaskStatus};
use crate::id::{AgentId, TaskId, UserId, WorkComputerId, WorkspaceId};

/// Agent 任务：把指令下发给绑定工作电脑上的 runtime 执行，输出聚合回传。
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AgentTask {
    pub id: TaskId,
    pub workspace_id: WorkspaceId,
    pub creator_id: UserId,
    pub agent_id: AgentId,
    pub computer_id: Option<WorkComputerId>,
    pub title: String,
    /// 发给 runtime 的自然语言指令（AI runtime 模式下作为 CLI 参数）。
    pub prompt: Option<String>,
    /// 自定义 shell 命令（有值时绕过 runtime 直接执行，高级用法）。
    pub command: Option<String>,
    pub runtime: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub source: TaskSource,
    /// 聚合输出（stdout/stderr 按到达顺序追加）。
    pub output: String,
    pub exit_code: Option<i32>,
    pub error: Option<String>,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
