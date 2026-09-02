use brier_error::Result;
use std::collections::HashMap;

/// OAuth 提供方配置（client_id / secret / redirect_uri）。
/// 每个登录厂商（github/gitee/gitlab…）对应一份，key 为 provider 名。
#[derive(Debug, Clone)]
pub struct OAuthConfig {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
}

impl OAuthConfig {
    /// 从 `{PREFIX}_CLIENT_ID` / `{PREFIX}_CLIENT_SECRET` / `{PREFIX}_REDIRECT_URI` 读取。
    fn from_env(prefix: &str) -> Result<Self> {
        Ok(Self {
            client_id: std::env::var(format!("{prefix}_CLIENT_ID"))
                .map_err(|e| brier_error::BrierError::Config(e.to_string()))?,
            client_secret: std::env::var(format!("{prefix}_CLIENT_SECRET"))
                .map_err(|e| brier_error::BrierError::Config(e.to_string()))?,
            redirect_uri: std::env::var(format!("{prefix}_REDIRECT_URI"))
                .map_err(|e| brier_error::BrierError::Config(e.to_string()))?,
        })
    }
}

#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub jwt_secret: String,
    pub token_encryption_key: String,
    pub frontend_dir: String,
    pub frontend_url: Option<String>,
    pub database_url: String,
    /// 会话 Cookie 是否携带 Secure 属性。生产（HTTPS）置 true；本地 http 开发保持 false。
    pub cookie_secure: bool,
}

#[derive(Debug, Clone)]
pub struct AppConfig {
    /// provider 名 → OAuth 配置。github 必填，其余厂商配置了才注册。
    pub providers: HashMap<String, OAuthConfig>,
    pub server: ServerConfig,
}

impl AppConfig {
    pub fn from_env() -> Result<Self> {
        let mut providers = HashMap::new();
        providers.insert(
            "github".to_string(),
            OAuthConfig::from_env("GITHUB")?,
        );

        // 可选厂商：三组环境变量齐全才注册（当前无对应实现时仅配置不生效，
        // 由 brier-api 的 providers 注册表决定实际可用 provider）。
        for name in ["gitee", "gitlab"] {
            let prefix = name.to_uppercase();
            let cfg = (
                std::env::var(format!("{prefix}_CLIENT_ID")),
                std::env::var(format!("{prefix}_CLIENT_SECRET")),
                std::env::var(format!("{prefix}_REDIRECT_URI")),
            );
            if let (Ok(client_id), Ok(client_secret), Ok(redirect_uri)) = cfg {
                providers.insert(
                    name.to_string(),
                    OAuthConfig {
                        client_id,
                        client_secret,
                        redirect_uri,
                    },
                );
            }
        }

        let port: u16 = std::env::var("PORT")
            .map_err(|e| brier_error::BrierError::Config(e.to_string()))?
            .parse()
            .map_err(|e| brier_error::BrierError::Config(format!("invalid PORT: {}", e)))?;

        let server = ServerConfig {
            host: std::env::var("HOST")
                .map_err(|e| brier_error::BrierError::Config(e.to_string()))?,
            port,
            jwt_secret: std::env::var("JWT_SECRET")
                .map_err(|e| brier_error::BrierError::Config(e.to_string()))?,
            token_encryption_key: std::env::var("TOKEN_ENCRYPTION_KEY")
                .map_err(|e| brier_error::BrierError::Config(e.to_string()))?,
            frontend_dir: std::env::var("FRONTEND_DIR")
                .map_err(|e| brier_error::BrierError::Config(e.to_string()))?,
            frontend_url: std::env::var("FRONTEND_URL").ok().filter(|s| !s.is_empty()),
            database_url: std::env::var("DATABASE_URL")
                .map_err(|e| brier_error::BrierError::Config(e.to_string()))?,
            cookie_secure: std::env::var("COOKIE_SECURE")
                .map(|v| v == "true" || v == "1")
                .unwrap_or(false),
        };

        Ok(Self { providers, server })
    }
}
