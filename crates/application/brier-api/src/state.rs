use std::collections::HashMap;
use std::sync::Arc;

use brier_config::AppConfig;
use brier_core::auth::OAuthProvider;
use brier_core::tunnel::ConnectionRegistry;
use brier_github_auth::GithubAuth;
use brier_jwt::{JwtSigner, JwtVerifier};
use sea_orm::DatabaseConnection;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    /// 可用的 OAuth 提供方注册表（provider 名 → 实现）。动态路由 `/api/auth/:provider/*`
    /// 从注册表分发；新增厂商（Gitee/GitLab…）在 `AppState::new` 中注册即可。
    pub providers: HashMap<String, Arc<dyn OAuthProvider>>,
    /// GitHub 具体实例：`/api/github/*`（仓库列表等 GitHub 特有 API）直接使用。
    pub github_auth: GithubAuth,
    pub jwt_signer: JwtSigner,
    pub jwt_verifier: JwtVerifier,
    /// 会话 Cookie 是否携带 Secure 属性。
    pub cookie_secure: bool,
    pub frontend_url: Option<String>,
    pub tunnel_registry: ConnectionRegistry,
}

impl AppState {
    pub fn new(config: &AppConfig, db: DatabaseConnection) -> Self {
        let github_cfg = config
            .providers
            .get("github")
            .expect("github provider must be configured");
        let github_auth = GithubAuth::new(github_cfg.clone());

        let mut providers: HashMap<String, Arc<dyn OAuthProvider>> = HashMap::new();
        providers.insert("github".to_string(), Arc::new(github_auth.clone()));
        // 新增 OAuth 厂商时在此注册，如：
        // if let Some(cfg) = config.providers.get("gitee") {
        //     providers.insert("gitee".to_string(), Arc::new(GiteeAuth::new(cfg.clone())));
        // }

        Self {
            db,
            providers,
            github_auth,
            jwt_signer: JwtSigner::new(&config.server.jwt_secret),
            jwt_verifier: JwtVerifier::new(&config.server.jwt_secret),
            cookie_secure: config.server.cookie_secure,
            frontend_url: config.server.frontend_url.clone(),
            tunnel_registry: ConnectionRegistry::new(),
        }
    }
}
