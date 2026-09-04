use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::enums::{AgentStatus, AgentVisibility, PublicScope};
use crate::id::{AgentId, UserId, WorkComputerId, WorkspaceId};

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
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
    /// Agent 任务执行的工作目录（daemon 在该目录 spawn runtime），空则继承 daemon 目录。
    pub workdir: Option<String>,
    pub last_active: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
