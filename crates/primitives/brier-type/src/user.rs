use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::enums::UserStatus;
use crate::id::UserId;

/// 账户本体。第三方身份（OAuth）与本地凭证（手机号/密码）统一挂载在
/// `id`（用户 UUID）之下；password_hash 属敏感凭证，永不进入该 API 模型。
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct User {
    pub id: UserId,
    pub username: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub status: UserStatus,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
