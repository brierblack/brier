use async_trait::async_trait;
use brier_error::Result;
use serde::{Deserialize, Serialize};

/// 代码仓库信息（厂商 API 返回的仓库视图，非 Brier 领域概念）。
/// 与 `RepositoryProvider` 强绑定（trait 方法签名引用），故同居本模块；
/// 消费方仅限适配层（brier-forge）与应用层（brier-api）两端，不进 brier-type。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RepoInfo {
    pub full_name: String,
    pub name: String,
    pub private: bool,
}

/// 代码托管平台资源访问抽象。
///
/// 登录后对厂商平台上的代码资源（仓库 / PR / 评论…）的读写操作。
/// 与 `auth::OAuthProvider` 互补：OAuthProvider 解决"我是谁"（登录认证），
/// 本 trait 解决"我能拿你的什么"（资源访问）。当前仅含 `list_repos`，
/// 自动化触发（webhook/PR/评论）等新能力按需在此演进。
#[async_trait]
pub trait RepositoryProvider: Send + Sync {
    /// 唯一标识，与 `OAuthProvider::provider_name` 一致（如 `"github"`），
    /// 对应 `user_identities.provider`。
    fn provider_name(&self) -> &str;

    /// 列出当前令牌可见的仓库。
    async fn list_repos(&self, access_token: &str) -> Result<Vec<RepoInfo>>;
}
