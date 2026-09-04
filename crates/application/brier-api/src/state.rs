use brier_config::AppConfig;
use brier_core::event_bus::EventBus;
use brier_core::tunnel::ConnectionRegistry;
use brier_crypto::TokenCipher;
use brier_forge::ProviderRegistry;
use brier_jwt::{JwtSigner, JwtVerifier};
use brier_tunnel::{OutputBatcher, TaskWorkspaces};
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
    /// 每用户 SSE 事件广播：工作电脑状态变更推送给前端（替代轮询）。
    pub event_bus: EventBus,
    /// task_id → workspace_id 索引（隧道按会话过滤输出流时使用）。
    pub workspaces: TaskWorkspaces,
    /// 任务输出批量缓冲（合并落库 + SSE 输出事件）。
    pub output_batcher: OutputBatcher,
    /// 第三方 OAuth 令牌加解密器（AES-256-GCM），加密存储在 user_identities.access_token。
    pub token_cipher: TokenCipher,
}

impl AppState {
    /// 构造 AppState。**须在 tokio runtime 内调用**（`OutputBatcher::new` 会启动后台 writer）。
    pub fn new(config: &AppConfig, db: DatabaseConnection) -> Self {
        let event_bus = EventBus::new();
        Self {
            db: db.clone(),
            providers: ProviderRegistry::from_config(config),
            jwt_signer: JwtSigner::new(&config.server.jwt_secret),
            jwt_verifier: JwtVerifier::new(&config.server.jwt_secret),
            cookie_secure: config.server.cookie_secure,
            frontend_url: config.server.frontend_url.clone(),
            tunnel_registry: ConnectionRegistry::new(),
            event_bus: event_bus.clone(),
            workspaces: TaskWorkspaces::new(),
            output_batcher: OutputBatcher::new(db, event_bus),
            token_cipher: TokenCipher::from_key_str(&config.server.token_encryption_key)
                .expect("TOKEN_ENCRYPTION_KEY must be valid and non-empty"),
        }
    }
}
