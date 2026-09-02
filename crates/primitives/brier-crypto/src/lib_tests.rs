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
