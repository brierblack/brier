use brier_config::GithubConfig;
use brier_core::auth::{AuthProvider, UserInfo};
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
}

impl GithubAuth {
    pub fn new(config: GithubConfig) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
        }
    }

    pub fn authorize_url(&self) -> String {
        format!(
            "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope=repo",
            self.config.client_id, self.config.redirect_uri
        )
    }

    pub async fn exchange_code(&self, code: &str) -> Result<String> {
        let resp = self
            .client
            .post("https://github.com/login/oauth/access_token")
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

    pub async fn get_user(&self, access_token: &str) -> Result<UserInfo> {
        let resp = self
            .client
            .get("https://api.github.com/user")
            .header("Authorization", format!("Bearer {access_token}"))
            .header("User-Agent", "brier")
            .send()
            .await
            .map_err(|e| BrierError::Provider(e.to_string()))?;

        let body: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| BrierError::Provider(e.to_string()))?;

        Ok(UserInfo {
            id: body["id"].as_u64().unwrap_or(0),
            login: body["login"].as_str().unwrap_or_default().to_string(),
            name: body["name"].as_str().map(|s| s.to_string()),
            email: body["email"].as_str().map(|s| s.to_string()),
            avatar_url: body["avatar_url"].as_str().map(|s| s.to_string()),
        })
    }

    pub async fn list_repos(&self, access_token: &str) -> Result<Vec<RepoInfo>> {
        let resp = self
            .client
            .get("https://api.github.com/user/repos?per_page=100&sort=updated&direction=desc")
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

impl AuthProvider for GithubAuth {
    fn provider_name(&self) -> &str {
        "github"
    }
}
