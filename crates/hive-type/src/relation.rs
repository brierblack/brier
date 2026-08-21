use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::id::{AgentId, AgentTeamId, UserId, WorkspaceId};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkspaceMember {
    pub workspace_id: WorkspaceId,
    pub user_id: UserId,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AgentTeamMember {
    pub team_id: AgentTeamId,
    pub agent_id: AgentId,
    pub created_at: DateTime<Utc>,
}
