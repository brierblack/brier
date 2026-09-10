use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::enums::{AgentStatus, AgentVisibility};
use crate::id::{AgentId, UserId, WorkComputerId, WorkspaceId};

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Agent {
    pub id: AgentId,
    pub workspace_id: WorkspaceId,
    pub creator_id: UserId,
    pub work_computer_id: Option<WorkComputerId>,
    /// 绑定的工作电脑名（冗余字段，绑定/换绑时随 id 一起写入，便于详情页展示）。
    pub work_computer_name: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub avatar: Option<String>,
    pub status: AgentStatus,
    pub visibility: AgentVisibility,
    pub runtime: Option<String>,
    /// 显式指定的模型名；空（NULL）表示不指定、由 runtime 自己决定。
    pub model: Option<String>,
    /// 并发数（创建时默认 3，当前无修改入口；存档/展示语义）。
    pub concurrency: i32,
    /// Agent 任务执行的工作目录（daemon 在该目录 spawn runtime），空则继承 daemon 目录。
    pub workdir: Option<String>,
    pub last_active: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
