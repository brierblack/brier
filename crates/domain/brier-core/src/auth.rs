use async_trait::async_trait;
use brier_error::Result;
use serde::{Deserialize, Serialize};

/// 第三方身份提供方返回的用户身份（provider 内部 ID + 资料）。
/// `provider_uid` 是 provider 侧的用户唯一标识（如 GitHub id），与
/// `brier_type::User`（账户本体）解耦，由 `user_identities` 表关联。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProviderIdentity {
    pub provider_uid: String,
    pub username: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
}

/// OAuth 登录提供方抽象。
///
/// 接入新厂商（Gitee/GitLab/自建 Gitea 等）时实现该 trait 即可复用统一登录编排：
/// `authorize_url` → 用户跳转授权 → `exchange_code` → `fetch_identity`。
/// 注意：手机号/密码等本地凭证登录不走本 trait，属于独立的凭证认证流程。
#[async_trait]
pub trait OAuthProvider: Send + Sync {
    /// 唯一标识，如 `"github"` / `"gitee"`，与 `user_identities.provider` 对应。
    fn provider_name(&self) -> &str;

    /// 用户跳转的授权页 URL。
    fn authorize_url(&self) -> String;

    /// 用授权码换取访问令牌。
    async fn exchange_code(&self, code: &str) -> Result<String>;

    /// 用访问令牌获取用户身份。
    async fn fetch_identity(&self, access_token: &str) -> Result<ProviderIdentity>;
}
