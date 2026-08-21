use hive_error::Result;

#[derive(Debug, Clone)]
pub struct GithubConfig {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
}

#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub jwt_secret: String,
    pub frontend_dir: String,
    pub frontend_url: Option<String>,
    pub database_url: String,
}

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub github: GithubConfig,
    pub server: ServerConfig,
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

        let port: u16 = std::env::var("PORT")
            .map_err(|e| hive_error::HiveError::Config(e.to_string()))?
            .parse()
            .map_err(|e| hive_error::HiveError::Config(format!("invalid PORT: {}", e)))?;

        let server = ServerConfig {
            host: std::env::var("HOST")
                .map_err(|e| hive_error::HiveError::Config(e.to_string()))?,
            port,
            jwt_secret: std::env::var("JWT_SECRET")
                .map_err(|e| hive_error::HiveError::Config(e.to_string()))?,
            frontend_dir: std::env::var("FRONTEND_DIR")
                .map_err(|e| hive_error::HiveError::Config(e.to_string()))?,
            frontend_url: std::env::var("FRONTEND_URL").ok().filter(|s| !s.is_empty()),
            database_url: std::env::var("DATABASE_URL")
                .map_err(|e| hive_error::HiveError::Config(e.to_string()))?,
        };

        Ok(Self { github, server })
    }
}
