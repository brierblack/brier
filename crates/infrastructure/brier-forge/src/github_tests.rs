use super::GithubProvider;
use brier_config::OAuthConfig;
use brier_core::auth::OAuthProvider;
use brier_core::repo::RepositoryProvider;
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
        .and(path("/login/oauth/access_token"))
        .and(header("Accept", "application/json"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "access_token": "gho_test_123"
        })))
        .mount(&server)
        .await;

    let auth = GithubProvider::with_mock_base(config(), &server.uri());
    let token = auth.exchange_code("some-code").await.unwrap();
    assert_eq!(token, "gho_test_123");
}

#[tokio::test]
async fn exchange_code_missing_token_is_auth_error() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/login/oauth/access_token"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "error": "bad_verification_code"
        })))
        .mount(&server)
        .await;

    let auth = GithubProvider::with_mock_base(config(), &server.uri());
    let err = auth.exchange_code("bad-code").await.unwrap_err();
    assert!(matches!(err, BrierError::Auth(_)));
}

#[tokio::test]
async fn fetch_identity_parses_fields() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/user"))
        .and(header("Authorization", "Bearer gho_test_123"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "id": 12345678,
            "login": "octocat",
            "name": "Octo Cat",
            "email": "octo@example.com",
            "avatar_url": "https://avatars.example/1"
        })))
        .mount(&server)
        .await;

    let auth = GithubProvider::with_mock_base(config(), &server.uri());
    let identity = auth.fetch_identity("gho_test_123").await.unwrap();
    assert_eq!(identity.provider_uid, "12345678");
    assert_eq!(identity.username, "octocat");
    assert_eq!(identity.name.as_deref(), Some("Octo Cat"));
    assert_eq!(identity.email.as_deref(), Some("octo@example.com"));
    assert_eq!(identity.avatar_url.as_deref(), Some("https://avatars.example/1"));
}

#[tokio::test]
async fn fetch_identity_missing_id_is_provider_error() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/user"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "login": "octocat"
        })))
        .mount(&server)
        .await;

    let auth = GithubProvider::with_mock_base(config(), &server.uri());
    let err = auth.fetch_identity("gho_test_123").await.unwrap_err();
    assert!(matches!(err, BrierError::Provider(_)));
}

#[tokio::test]
async fn fetch_identity_missing_login_falls_back_to_empty_username() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/user"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "id": 12345678
        })))
        .mount(&server)
        .await;

    let auth = GithubProvider::with_mock_base(config(), &server.uri());
    let identity = auth.fetch_identity("gho_test_123").await.unwrap();
    assert_eq!(identity.provider_uid, "12345678");
    assert_eq!(identity.username, "");
    assert_eq!(identity.name, None);
}

#[tokio::test]
async fn provider_name_and_authorize_url() {
    let auth = GithubProvider::new(config());
    assert_eq!(OAuthProvider::provider_name(&auth), "github");
    let url = auth.authorize_url();
    assert!(url.contains("client_id=test-client"));
    assert!(url.contains("redirect_uri=http://localhost/callback"));
    assert!(url.contains("scope=repo"));
}

#[tokio::test]
async fn list_repos_parses_repo_info() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/user/repos"))
        .and(header("Authorization", "Bearer gho_test_123"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!([
            {
                "full_name": "brier/brier",
                "name": "brier",
                "private": false
            },
            {
                "full_name": "octocat/private-repo",
                "name": "private-repo",
                "private": true
            }
        ])))
        .mount(&server)
        .await;

    let auth = GithubProvider::with_mock_base(config(), &server.uri());
    let repos = auth.list_repos("gho_test_123").await.unwrap();
    assert_eq!(repos.len(), 2);
    assert_eq!(repos[0].full_name, "brier/brier");
    assert_eq!(repos[1].private, true);
}
