use async_trait::async_trait;
use brier_config::GithubConfig;
use brier_core::auth::{OAuthProvider, ProviderIdentity};
use brier_error::{BrierError, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoInfo {
    pub full_name: String,
    pub name: String,
    pub private: bool,
}

#[derive(Clone)]
pub struct GithubAuth {
    config: GithubConfig,
    client: reqwest::Client,
    /// OAuth 授权/令牌端点，默认 https://github.com，测试可指向 mock server。
    oauth_base: String,
    /// REST API 端点，默认 https://api.github.com，测试可指向 mock server。
    api_base: String,
}

impl GithubAuth {
    pub fn new(config: GithubConfig) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
            oauth_base: "https://github.com".to_string(),
            api_base: "https://api.github.com".to_string(),
        }
    }

    /// 测试用：所有端点指向 mock server。
    #[cfg(test)]
    fn with_mock_base(config: GithubConfig, base: &str) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
            oauth_base: base.to_string(),
            api_base: base.to_string(),
        }
    }

    /// GitHub 仓库列表（非认证能力，OAuth 之外的特有 API 客户端方法）。
    pub async fn list_repos(&self, access_token: &str) -> Result<Vec<RepoInfo>> {
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

#[async_trait]
impl OAuthProvider for GithubAuth {
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

        Ok(ProviderIdentity {
            provider_uid: body["id"].as_u64().unwrap_or(0).to_string(),
            username: body["login"].as_str().unwrap_or_default().to_string(),
            name: body["name"].as_str().map(|s| s.to_string()),
            email: body["email"].as_str().map(|s| s.to_string()),
            avatar_url: body["avatar_url"].as_str().map(|s| s.to_string()),
        })
    }
}

#[cfg(test)]
mod lib_tests;
