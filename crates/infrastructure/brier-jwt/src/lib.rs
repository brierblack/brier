use brier_error::{BrierError, Result};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

/// 会话令牌有效期：24 小时。
pub const SESSION_TTL_SECS: u64 = 86400;

/// 验证时允许的时钟偏移。
pub const ALLOWED_LEEWAY_SECS: u64 = 60;

/// 会话声明。仅承载识别用户所需的最少字段，profile 信息一律从数据库读取。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SessionClaims {
    /// 用户 UUID（`users.id`）。
    pub sub: Uuid,
    /// 签发时间（Unix 秒）。
    pub iat: u64,
    /// 过期时间（Unix 秒）。
    pub exp: u64,
    /// 令牌唯一 ID，预留撤销粒度。
    pub jti: Uuid,
}

impl SessionClaims {
    pub fn new(user_id: Uuid) -> Result<Self> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| BrierError::Jwt(e.to_string()))?
            .as_secs();
        Ok(Self {
            sub: user_id,
            iat: now,
            exp: now + SESSION_TTL_SECS,
            jti: Uuid::new_v4(),
        })
    }
}

/// 签发方。持有密钥，避免每次调用重建编码密钥。
#[derive(Clone)]
pub struct JwtSigner {
    key: EncodingKey,
}

impl JwtSigner {
    pub fn new(secret: &str) -> Self {
        Self {
            key: EncodingKey::from_secret(secret.as_bytes()),
        }
    }

    pub fn sign(&self, claims: &SessionClaims) -> Result<String> {
        encode(&Header::default(), claims, &self.key)
            .map_err(|e| BrierError::Jwt(e.to_string()))
    }
}

/// 验证方。算法与验证策略集中于此，全应用仅此一处。
#[derive(Clone)]
pub struct JwtVerifier {
    key: DecodingKey,
    validation: Validation,
}

impl JwtVerifier {
    pub fn new(secret: &str) -> Self {
        let mut validation = Validation::new(jsonwebtoken::Algorithm::HS256);
        validation.leeway = ALLOWED_LEEWAY_SECS;
        validation.set_required_spec_claims(&["exp", "iat"]);
        Self {
            key: DecodingKey::from_secret(secret.as_bytes()),
            validation,
        }
    }

    pub fn verify(&self, token: &str) -> Result<SessionClaims> {
        decode::<SessionClaims>(token, &self.key, &self.validation)
            .map(|data| data.claims)
            .map_err(|e| BrierError::Jwt(e.to_string()))
    }
}

#[cfg(test)]
mod lib_tests;
