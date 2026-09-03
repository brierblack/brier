use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::enums::{WorkComputerStatus, WorkComputerType};
use crate::id::{UserId, WorkComputerId};

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkComputer {
    pub id: WorkComputerId,
    pub user_id: UserId,
    pub name: String,
    pub computer_type: WorkComputerType,
    pub host: String,
    pub os: String,
    pub status: WorkComputerStatus,
    pub last_seen_at: Option<DateTime<Utc>>,
    /// 电脑上可用的运行时（CLI 探测上报，如 ["OpenCode", "Node.js"]）。
    pub runtimes: Vec<String>,
    /// 接入 CLI（brier daemon）版本号。
    pub version: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
