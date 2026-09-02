//! 令牌加解密工具（AES-256-GCM）。
//!
//! 用于透明加密存储在 user_identities.access_token 中的第三方 OAuth 令牌。
//! 密钥从环境变量 TOKEN_ENCRYPTION_KEY 读取，经 SHA-256 派生为 32 字节 AES 密钥，
//! 与 JWT_SECRET 独立，不复用。

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use base64::Engine;
use brier_error::{BrierError, Result};
use rand::RngCore;
use sha2::{Digest, Sha256};

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
