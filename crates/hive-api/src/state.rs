use hive_config::AppConfig;
use hive_github_auth::GithubAuth;
use sea_orm::DatabaseConnection;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub github_auth: GithubAuth,
    pub jwt_secret: String,
    pub frontend_url: Option<String>,
}

impl AppState {
    pub fn new(config: &AppConfig, db: DatabaseConnection) -> Self {
        Self {
            db,
            github_auth: GithubAuth::new(config.github.clone()),
            jwt_secret: config.server.jwt_secret.clone(),
            frontend_url: config.server.frontend_url.clone(),
        }
    }
}
