use std::collections::HashMap;
use std::sync::Arc;

use brier_config::AppConfig;
use brier_contract::auth::OAuthProvider;
use brier_contract::repo::RepositoryProvider;

use crate::GithubProvider;

/// 代码托管平台适配器注册表。
///
/// 由 `AppConfig` 构建，按 provider 名分发两类能力：
/// - 认证（`OAuthProvider`）：登录编排用；
/// - 仓库 API（`RepositoryProvider`）：登录后资源访问用。
///
/// 一个厂商一个 struct 同时实现两个 trait，注册进两个表（`Arc` 共享同一实例）。
/// 新增厂商（Gitee/GitLab…）：实现两个 trait → 在 `from_config` 注册一行，
/// 业务层与前端零改动。
#[derive(Clone)]
pub struct ProviderRegistry {
    auth: HashMap<String, Arc<dyn OAuthProvider>>,
    repositories: HashMap<String, Arc<dyn RepositoryProvider>>,
}

impl ProviderRegistry {
    pub fn from_config(config: &AppConfig) -> Self {
        let mut auth: HashMap<String, Arc<dyn OAuthProvider>> = HashMap::new();
        let mut repositories: HashMap<String, Arc<dyn RepositoryProvider>> = HashMap::new();

        // 已实现的厂商适配。github 必填（AppConfig 保证），其余按需追加。
        if let Some(cfg) = config.providers.get("github") {
            let provider = Arc::new(GithubProvider::new(cfg.clone()));
            auth.insert("github".to_string(), provider.clone());
            repositories.insert("github".to_string(), provider);
        }
        // 示例：接入 Gitee 时
        // if let Some(cfg) = config.providers.get("gitee") {
        //     let provider = Arc::new(crate::gitee::GiteeProvider::new(cfg.clone()));
        //     auth.insert("gitee".to_string(), provider.clone());
        //     repositories.insert("gitee".to_string(), provider);
        // }

        Self { auth, repositories }
    }

    /// 按名取 OAuth 认证提供方（登录编排用）。未注册返回 None。
    pub fn get_auth(&self, name: &str) -> Option<Arc<dyn OAuthProvider>> {
        self.auth.get(name).cloned()
    }

    /// 按名取代码仓库提供方（仓库 API 用）。未注册返回 None。
    pub fn get_repository(&self, name: &str) -> Option<Arc<dyn RepositoryProvider>> {
        self.repositories.get(name).cloned()
    }
}
