use brier_error::{BrierError, Result};
use brier_type::id::UserId;
use brier_type::User;

use crate::entity::user;

pub trait DbErrExt {
    fn to_brier(self) -> BrierError;
}

impl DbErrExt for sea_orm::DbErr {
    fn to_brier(self) -> BrierError {
        BrierError::Database(self.to_string())
    }
}

fn parse_enum<T: serde::de::DeserializeOwned>(s: &str, label: &str) -> Result<T> {
    serde_json::from_value(serde_json::Value::String(s.to_string()))
        .map_err(|e| BrierError::Validation(format!("invalid {}: {} ({})", label, s, e)))
}

// --- User ---

impl TryFrom<user::Model> for User {
    type Error = BrierError;

    fn try_from(m: user::Model) -> Result<Self> {
        Ok(Self {
            id: UserId(m.id),
            username: m.username,
            name: m.name,
            email: m.email,
            phone: m.phone,
            avatar_url: m.avatar_url,
            // 账户本体不含身份来源，provider 由调用方查询 user_identities 后回填
            provider: None,
            status: parse_enum(&m.status, "UserStatus")?,
            last_login_at: m.last_login_at,
            created_at: m.created_at,
            updated_at: m.updated_at,
        })
    }
}

// user_identity 无领域类型对应，实体仅 repository 内部使用，无需转换 impl。
