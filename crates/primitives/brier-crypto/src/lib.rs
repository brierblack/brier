//! 令牌加解密与接入令牌哈希工具。
//!
//! - `TokenCipher`：AES-256-GCM 可逆加密（用于 user_identities.access_token 等
//!   需要读回明文的第三方 OAuth 令牌），密钥经 SHA-256 派生，与 JWT_SECRET 独立。
//! - `hash_token`：SHA-256 不可逆哈希（用于 BRIER_TOKEN 接入令牌的落库存储，
//!   原文只在生成时返回一次，校验时比对哈希）。

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use base64::Engine;
use brier_error::{BrierError, Result};
use rand::RngCore;
use sha2::{Digest, Sha256};

/// 对接入令牌做不可逆哈希（SHA-256 → base64），用于 user_connect_tokens 落库。
pub fn hash_token(token: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    base64::engine::general_purpose::STANDARD.encode(hasher.finalize())
}

/// 生成高强度随机接入令牌（32 字节 → base64url，不含 padding）。
pub fn generate_token() -> String {
    use rand::Rng;
    let bytes: [u8; 32] = rand::thread_rng().gen();
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

#[derive(Clone)]
pub struct TokenCipher {
    cipher: Aes256Gcm,
}

impl TokenCipher {
    /// 从任意长度的密钥字符串构造加密器：SHA-256 派生 32 字节 AES-256 密钥。
    pub fn from_key_str(key: &str) -> Result<Self> {
        if key.is_empty() {
            return Err(BrierError::Config(
                "TOKEN_ENCRYPTION_KEY must not be empty".into(),
            ));
        }
        let mut hasher = Sha256::new();
        hasher.update(key.as_bytes());
        let digest = hasher.finalize();
        let key = Key::<Aes256Gcm>::from_slice(&digest);
        Ok(Self {
            cipher: Aes256Gcm::new(key),
        })
    }

    /// 加密明文：生成随机 12 字节 nonce，AES-256-GCM 加密，返回 base64(nonce + ciphertext)。
    pub fn encrypt(&self, plaintext: &str) -> Result<String> {
        let mut nonce_bytes = [0u8; 12];
        rand::thread_rng().fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        let ciphertext = self
            .cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| BrierError::Config(format!("encryption failed: {e}")))?;
        let mut combined = nonce_bytes.to_vec();
        combined.extend_from_slice(&ciphertext);
        Ok(base64::engine::general_purpose::STANDARD.encode(&combined))
    }

    /// 解密 base64(nonce + ciphertext)。
    pub fn decrypt(&self, encoded: &str) -> Result<String> {
        let combined = base64::engine::general_purpose::STANDARD
            .decode(encoded)
            .map_err(|e| BrierError::Config(format!("base64 decode failed: {e}")))?;
        if combined.len() < 12 {
            return Err(BrierError::Config("ciphertext too short".into()));
        }
        let (nonce_bytes, ciphertext) = combined.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        let plaintext = self
            .cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| BrierError::Config(format!("decryption failed: {e}")))?;
        String::from_utf8(plaintext)
            .map_err(|e| BrierError::Config(format!("invalid utf8: {e}")))
    }

    /// 尝试解密；失败则返回原始值（兼容历史明文令牌，下次登录时自动加密）。
    pub fn decrypt_or_raw(&self, value: &str) -> String {
        match self.decrypt(value) {
            Ok(plaintext) => plaintext,
            Err(_) => value.to_string(),
        }
    }
}

#[cfg(test)]
mod lib_tests;
