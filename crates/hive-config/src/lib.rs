use hive_error::Result;
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct GithubConfig {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub github: GithubConfig,
}

impl AppConfig {
    pub fn from_env() -> Result<Self> {
        let github = GithubConfig {
            client_id: std::env::var("GITHUB_CLIENT_ID")
                .map_err(|e| hive_error::HiveError::Config(e.to_string()))?,
            client_secret: std::env::var("GITHUB_CLIENT_SECRET")
                .map_err(|e| hive_error::HiveError::Config(e.to_string()))?,
            redirect_uri: std::env::var("GITHUB_REDIRECT_URI")
                .map_err(|e| hive_error::HiveError::Config(e.to_string()))?,
        };
        Ok(Self { github })
    }
}
