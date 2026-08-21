use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::enums::{TeamMode, TeamStatus};
use crate::id::{AgentId, AgentTeamId, UserId, WorkspaceId};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AgentTeam {
    pub id: AgentTeamId,
    pub workspace_id: WorkspaceId,
    pub creator_id: UserId,
    pub primary_agent_id: Option<AgentId>,
    pub name: String,
    pub description: Option<String>,
    pub mode: TeamMode,
    pub status: TeamStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
