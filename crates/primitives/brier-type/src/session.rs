use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::enums::MessageRole;
use crate::id::{AgentId, SessionId, SessionMessageId, UserId, WorkspaceId};

/// 会话：用户与 Agent 围绕任务的对话记录（对应一列消息）。
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Session {
    pub id: SessionId,
    pub workspace_id: WorkspaceId,
    pub creator_id: UserId,
    pub agent_id: AgentId,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 会话消息：一条 user 指令或一条 agent 回复（可与任务关联）。
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SessionMessage {
    pub id: SessionMessageId,
    pub session_id: SessionId,
    pub role: MessageRole,
    pub content: String,
    /// agent 回复时指向执行 Agent；user 消息可空。
    pub agent_id: Option<AgentId>,
    /// 关联的 Agent 任务（agent 回复 = 任务输出回填）。
    pub task_id: Option<crate::id::TaskId>,
    pub created_at: DateTime<Utc>,
}
