use brier_config::AppConfig;
use brier_core::tunnel::ConnectionRegistry;
use brier_forge::ProviderRegistry;
use brier_jwt::{JwtSigner, JwtVerifier};
use sea_orm::DatabaseConnection;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    /// 代码托管平台适配注册表：按 provider 名分发认证（OAuthProvider）与
    /// 仓库 API（RepositoryProvider）。动态路由 `/api/{provider}/*` 从注册表
    /// 分发；新增厂商（Gitee/GitLab…）只需在 `ProviderRegistry::from_config`
    /// 注册一行，brier-api 与前端零改动。
    pub providers: ProviderRegistry,
    pub jwt_signer: JwtSigner,
    pub jwt_verifier: JwtVerifier,
    /// 会话 Cookie 是否携带 Secure 属性。
    pub cookie_secure: bool,
    pub frontend_url: Option<String>,
    pub tunnel_registry: ConnectionRegistry,
}

impl AppState {
    pub fn new(config: &AppConfig, db: DatabaseConnection) -> Self {
        Self {
            db,
            providers: ProviderRegistry::from_config(config),
            jwt_signer: JwtSigner::new(&config.server.jwt_secret),
            jwt_verifier: JwtVerifier::new(&config.server.jwt_secret),
            cookie_secure: config.server.cookie_secure,
            frontend_url: config.server.frontend_url.clone(),
            tunnel_registry: ConnectionRegistry::new(),
        }
    }
}
