use super::GiteeProvider;
use brier_config::OAuthConfig;
use brier_contract::auth::OAuthProvider;
use brier_contract::repo::RepositoryProvider;
use brier_error::BrierError;
use wiremock::matchers::{header, method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

fn config() -> OAuthConfig {
    OAuthConfig {
        client_id: "test-client".to_string(),
        client_secret: "test-secret".to_string(),
        redirect_uri: "http://localhost/callback".to_string(),
    }
}

#[tokio::test]
async fn exchange_code_returns_access_token() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/oauth/token"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "access_token": "gitee_test_123"
        })))
        .mount(&server)
        .await;

    let auth = GiteeProvider::with_mock_base(config(), &server.uri());
    let token = auth.exchange_code("some-code").await.unwrap();
    assert_eq!(token, "gitee_test_123");
}

#[tokio::test]
async fn exchange_code_missing_token_is_auth_error() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/oauth/token"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "error_description": "invalid_grant"
        })))
        .mount(&server)
        .await;

    let auth = GiteeProvider::with_mock_base(config(), &server.uri());
    let err = auth.exchange_code("bad-code").await.unwrap_err();
    assert!(matches!(err, BrierError::Auth(_)));
}

#[tokio::test]
async fn fetch_identity_uses_token_auth_header() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/user"))
        .and(header("Authorization", "token gitee_test_123"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "id": 87654321,
            "login": "gitee_user",
            "name": "Gitee User",
            "email": "gitee@example.com",
            "avatar_url": "https://gitee.com/assets/avatars/1"
        })))
        .mount(&server)
        .await;

    let auth = GiteeProvider::with_mock_base(config(), &server.uri());
    let identity = auth.fetch_identity("gitee_test_123").await.unwrap();
    assert_eq!(identity.provider_uid, "87654321");
    assert_eq!(identity.username, "gitee_user");
    assert_eq!(identity.name.as_deref(), Some("Gitee User"));
    assert_eq!(identity.email.as_deref(), Some("gitee@example.com"));
    assert_eq!(identity.avatar_url.as_deref(), Some("https://gitee.com/assets/avatars/1"));
}

#[tokio::test]
async fn fetch_identity_missing_id_is_provider_error() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/user"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "login": "gitee_user"
        })))
        .mount(&server)
        .await;

    let auth = GiteeProvider::with_mock_base(config(), &server.uri());
    let err = auth.fetch_identity("gitee_test_123").await.unwrap_err();
    assert!(matches!(err, BrierError::Provider(_)));
}

#[tokio::test]
async fn fetch_identity_missing_email_is_none() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/user"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "id": 87654321,
            "login": "gitee_user"
        })))
        .mount(&server)
        .await;

    let auth = GiteeProvider::with_mock_base(config(), &server.uri());
    let identity = auth.fetch_identity("gitee_test_123").await.unwrap();
    assert_eq!(identity.provider_uid, "87654321");
    assert_eq!(identity.username, "gitee_user");
    assert_eq!(identity.email, None);
}

#[tokio::test]
async fn provider_name_and_authorize_url() {
    let auth = GiteeProvider::new(config());
    assert_eq!(OAuthProvider::provider_name(&auth), "gitee");
    let url = auth.authorize_url();
    assert!(url.contains("client_id=test-client"));
    assert!(url.contains("redirect_uri=http://localhost/callback"));
    assert!(url.contains("response_type=code"));
}

#[tokio::test]
async fn list_repos_parses_repo_info() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/user/repos"))
        .and(header("Authorization", "token gitee_test_123"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!([
            {
                "full_name": "brier/brier",
                "name": "brier",
                "private": false
            },
            {
                "full_name": "gitee_user/private-repo",
                "name": "private-repo",
                "private": true
            }
        ])))
        .mount(&server)
        .await;

    let auth = GiteeProvider::with_mock_base(config(), &server.uri());
    let repos = auth.list_repos("gitee_test_123").await.unwrap();
    assert_eq!(repos.len(), 2);
    assert_eq!(repos[0].full_name, "brier/brier");
    assert_eq!(repos[1].private, true);
}
