use super::*;

#[test]
fn encrypt_decrypt_roundtrip() {
    let cipher = TokenCipher::from_key_str("test-key").unwrap();
    let plaintext = "ghp_abc123secrettoken";
    let encrypted = cipher.encrypt(plaintext).unwrap();
    assert_ne!(encrypted, plaintext);
    let decrypted = cipher.decrypt(&encrypted).unwrap();
    assert_eq!(decrypted, plaintext);
}

#[test]
fn decrypt_or_raw_fallback_for_plaintext() {
    let cipher = TokenCipher::from_key_str("test-key").unwrap();
    let plaintext = "ghp_plain_text_token";
    let result = cipher.decrypt_or_raw(plaintext);
    assert_eq!(result, plaintext);
}

#[test]
fn different_encryptions_produce_different_ciphertext() {
    let cipher = TokenCipher::from_key_str("test-key").unwrap();
    let plaintext = "same-token";
    let enc1 = cipher.encrypt(plaintext).unwrap();
    let enc2 = cipher.encrypt(plaintext).unwrap();
    assert_ne!(enc1, enc2);
    assert_eq!(cipher.decrypt(&enc1).unwrap(), plaintext);
    assert_eq!(cipher.decrypt(&enc2).unwrap(), plaintext);
}

#[test]
fn empty_key_rejected() {
    let result = TokenCipher::from_key_str("");
    assert!(result.is_err());
}

#[test]
fn tampered_ciphertext_fails() {
    let cipher = TokenCipher::from_key_str("test-key").unwrap();
    let encrypted = cipher.encrypt("secret").unwrap();
    let mut tampered = encrypted.clone();
    let last = tampered.pop().unwrap();
    tampered.push(if last == 'A' { 'B' } else { 'A' });
    assert!(cipher.decrypt(&tampered).is_err());
}

#[test]
fn hash_token_is_deterministic_and_irreversible_marker() {
    let token = "random-brier-token";
    let h1 = hash_token(token);
    let h2 = hash_token(token);
    assert_eq!(h1, h2, "同一令牌哈希必须稳定");
    assert_ne!(h1, token, "哈希不得等于原文");
    assert_ne!(hash_token(token), hash_token("other-token"));
}

#[test]
fn generate_token_high_entropy_and_unique() {
    let t1 = generate_token();
    let t2 = generate_token();
    assert_ne!(t1, t2, "连续生成的令牌不得重复");
    assert!(t1.len() >= 32, "32 字节 base64url 长度应 >= 32");
    // URL-safe base64 无 padding：只含字母数字与 -_
    assert!(t1.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_'));
}

#[test]
fn generated_token_hashes_to_stored_value() {
    let token = generate_token();
    let stored = hash_token(&token);
    assert_eq!(hash_token(&token), stored, "校验时重新哈希应命中存储值");
}
