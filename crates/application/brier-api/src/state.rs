use brier_config::AppConfig;
use brier_core::tunnel::ConnectionRegistry;
use brier_github_auth::GithubAuth;
use brier_jwt::{JwtSigner, JwtVerifier};
use sea_orm::DatabaseConnection;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub github_auth: GithubAuth,
    pub jwt_signer: JwtSigner,
    pub jwt_verifier: JwtVerifier,
    pub frontend_url: Option<String>,
    pub tunnel_registry: ConnectionRegistry,
}

impl AppState {
    pub fn new(config: &AppConfig, db: DatabaseConnection) -> Self {
        Self {
            db,
            github_auth: GithubAuth::new(config.github.clone()),
            jwt_signer: JwtSigner::new(&config.server.jwt_secret),
            jwt_verifier: JwtVerifier::new(&config.server.jwt_secret),
            frontend_url: config.server.frontend_url.clone(),
            tunnel_registry: ConnectionRegistry::new(),
        }
    }
}
