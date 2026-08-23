use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::id::UserId;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct User {
 pub id: UserId,
 pub github_id: i64,
 pub login: String,
 pub name: Option<String>,
 pub email: Option<String>,
 pub avatar_url: Option<String>,
 #[serde(skip)]
 pub github_access_token: Option<String>,
 pub created_at: DateTime<Utc>,
 pub updated_at: DateTime<Utc>,
}
