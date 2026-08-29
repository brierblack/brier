use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::id::{UserId, WorkspaceId};

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Workspace {
    pub id: WorkspaceId,
    pub creator_id: UserId,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub avatar: Option<String>,
    pub instructions: Option<String>,
    pub repositories: Vec<String>,
    pub auto_pr_review: bool,
    pub auto_issue_assign: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
