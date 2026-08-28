use super::{SessionClaims, JwtSigner, JwtVerifier};
use brier_error::BrierError;
use uuid::Uuid;

const SECRET: &str = "test-secret-0123456789";

fn signer() -> JwtSigner {
    JwtSigner::new(SECRET)
}

fn verifier() -> JwtVerifier {
    JwtVerifier::new(SECRET)
}

#[test]
fn sign_then_verify_roundtrip() {
    let claims = SessionClaims::new(Uuid::new_v4()).unwrap();
    let token = signer().sign(&claims).unwrap();
    let decoded = verifier().verify(&token).unwrap();
    assert_eq!(decoded, claims);
}

#[test]
fn jti_is_unique_per_claim() {
    let a = SessionClaims::new(Uuid::new_v4()).unwrap();
    let b = SessionClaims::new(Uuid::new_v4()).unwrap();
    assert_ne!(a.jti, b.jti);
}

#[test]
fn rejects_tampered_payload() {
    let claims = SessionClaims::new(Uuid::new_v4()).unwrap();
    let token = signer().sign(&claims).unwrap();

    // 篡改中间 payload 段
    let mut segments: Vec<&str> = token.split('.').collect();
    segments[1] = "eyJmb3JnZWQiOjF9";
    let tampered = segments.join(".");

    let err = verifier().verify(&tampered).unwrap_err();
    assert!(matches!(err, BrierError::Jwt(_)));
}

#[test]
fn rejects_expired_token() {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let expired = SessionClaims {
        sub: Uuid::new_v4(),
        iat: now - 2 * super::SESSION_TTL_SECS,
        exp: now - super::SESSION_TTL_SECS,
        jti: Uuid::new_v4(),
    };
    let token = signer().sign(&expired).unwrap();
    let err = verifier().verify(&token).unwrap_err();
    assert!(matches!(err, BrierError::Jwt(_)));
}

#[test]
fn rejects_wrong_secret() {
    let claims = SessionClaims::new(Uuid::new_v4()).unwrap();
    let token = signer().sign(&claims).unwrap();
    let other = JwtVerifier::new("different-secret-9876543210");
    let err = other.verify(&token).unwrap_err();
    assert!(matches!(err, BrierError::Jwt(_)));
}

#[test]
fn accepts_token_expired_within_leeway() {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    // 过期 30 秒，落在 60 秒 leeway 窗口内，应验证通过
    let claims = SessionClaims {
        sub: Uuid::new_v4(),
        iat: now - 2 * super::SESSION_TTL_SECS,
        exp: now - 30,
        jti: Uuid::new_v4(),
    };
    let token = signer().sign(&claims).unwrap();
    assert!(verifier().verify(&token).is_ok());
}

#[test]
fn rejects_non_hs256_algorithm() {
    let claims = SessionClaims::new(Uuid::new_v4()).unwrap();
    // 用 HS384 签发，验证策略锁定 HS256，应拒绝
    let token = jsonwebtoken::encode(
        &jsonwebtoken::Header::new(jsonwebtoken::Algorithm::HS384),
        &claims,
        &jsonwebtoken::EncodingKey::from_secret(SECRET.as_bytes()),
    )
    .unwrap();
    let err = verifier().verify(&token).unwrap_err();
    assert!(matches!(err, BrierError::Jwt(_)));
}
