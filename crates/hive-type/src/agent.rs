use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::enums::{AgentStatus, AgentVisibility, PublicScope};
use crate::id::{AgentId, UserId, WorkComputerId, WorkspaceId};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Agent {
    pub id: AgentId,
    pub workspace_id: WorkspaceId,
    pub creator_id: UserId,
    pub work_computer_id: Option<WorkComputerId>,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub status: AgentStatus,
    pub visibility: AgentVisibility,
    pub public_scope: Option<PublicScope>,
    pub runtime: Option<String>,
    pub last_active: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
