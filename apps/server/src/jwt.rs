use hive_core::auth::UserInfo;
use hive_error::{HiveError, Result};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

const TOKEN_TTL_SECS: u64 = 86400;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: u64,
    pub login: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub exp: u64,
}

pub fn create_token(user: &UserInfo, secret: &str) -> Result<String> {
    let exp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| HiveError::Jwt(e.to_string()))?
        .as_secs()
        + TOKEN_TTL_SECS;

    let claims = Claims {
        sub: user.id,
        login: user.login.clone(),
        name: user.name.clone(),
        email: user.email.clone(),
        avatar_url: user.avatar_url.clone(),
        exp,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| HiveError::Jwt(e.to_string()))
}

pub fn verify_token(token: &str, secret: &str) -> Result<Claims> {
    let token_data = decode(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| HiveError::Jwt(e.to_string()))?;

    Ok(token_data.claims)
}
