use async_trait::async_trait;
use brier_config::OAuthConfig;
use brier_contract::auth::{OAuthProvider, ProviderIdentity};
use brier_contract::repo::{RepoInfo, RepositoryProvider};
use brier_error::{BrierError, Result};

/// GitHub 厂商适配：同时实现登录认证（`OAuthProvider`）与仓库 API（`RepositoryProvider`）。
#[derive(Clone)]
pub struct GithubProvider {
    config: OAuthConfig,
    client: reqwest::Client,
    /// OAuth 授权/令牌端点，默认 https://github.com，测试可指向 mock server。
    oauth_base: String,
    /// REST API 端点，默认 https://api.github.com，测试可指向 mock server。
    api_base: String,
}

impl GithubProvider {
    pub fn new(config: OAuthConfig) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
            oauth_base: "https://github.com".to_string(),
            api_base: "https://api.github.com".to_string(),
        }
    }

    /// 测试用：所有端点指向 mock server。
    #[cfg(test)]
    pub(crate) fn with_mock_base(config: OAuthConfig, base: &str) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
            oauth_base: base.to_string(),
            api_base: base.to_string(),
        }
    }
}

#[async_trait]
impl OAuthProvider for GithubProvider {
    fn provider_name(&self) -> &str {
        "github"
    }

    fn authorize_url(&self) -> String {
        format!(
            "{}/login/oauth/authorize?client_id={}&redirect_uri={}&scope=repo",
            self.oauth_base, self.config.client_id, self.config.redirect_uri
        )
    }

    async fn exchange_code(&self, code: &str) -> Result<String> {
        let resp = self
            .client
            .post(format!("{}/login/oauth/access_token", self.oauth_base))
            .header("Accept", "application/json")
            .json(&serde_json::json!({
                "client_id": self.config.client_id,
                "client_secret": self.config.client_secret,
                "code": code,
                "redirect_uri": self.config.redirect_uri,
            }))
            .send()
            .await
            .map_err(|e| BrierError::Provider(e.to_string()))?;

        let body: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| BrierError::Provider(e.to_string()))?;

        body["access_token"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| BrierError::Auth("failed to get access_token".into()))
    }

    async fn fetch_identity(&self, access_token: &str) -> Result<ProviderIdentity> {
        let resp = self
            .client
            .get(format!("{}/user", self.api_base))
            .header("Authorization", format!("Bearer {access_token}"))
            .header("User-Agent", "brier")
            .send()
            .await
            .map_err(|e| BrierError::Provider(e.to_string()))?;

        let body: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| BrierError::Provider(e.to_string()))?;

        let provider_uid = body["id"]
            .as_u64()
            .ok_or_else(|| BrierError::Provider("missing user id in provider response".into()))?
            .to_string();

        Ok(ProviderIdentity {
            provider_uid,
            username: body["login"].as_str().unwrap_or_default().to_string(),
            name: body["name"].as_str().map(|s| s.to_string()),
            email: body["email"].as_str().map(|s| s.to_string()),
            avatar_url: body["avatar_url"].as_str().map(|s| s.to_string()),
        })
    }
}

#[async_trait]
impl RepositoryProvider for GithubProvider {
    fn provider_name(&self) -> &str {
        "github"
    }

    async fn list_repos(&self, access_token: &str) -> Result<Vec<RepoInfo>> {
        let resp = self
            .client
            .get(format!("{}/user/repos", self.api_base))
            .query(&[("per_page", "100"), ("sort", "updated"), ("direction", "desc")])
            .header("Authorization", format!("Bearer {access_token}"))
            .header("User-Agent", "brier")
            .header("Accept", "application/vnd.github+json")
            .send()
            .await
            .map_err(|e| BrierError::Provider(e.to_string()))?;

        let repos: Vec<RepoInfo> = resp
            .json()
            .await
            .map_err(|e| BrierError::Provider(e.to_string()))?;

        Ok(repos)
    }
}

#[cfg(test)]
mod tests;
