//! 代码托管平台适配层（Forge Adapters）。
//!
//! 统一第三方代码托管平台（GitHub / Gitee / GitLab…）的接入：
//! - [`providers::github::GithubProvider`]：单个厂商的完整适配（登录认证 + 仓库 API），
//!   同时实现 `brier_contract::auth::OAuthProvider` 与 `brier_contract::repo::RepositoryProvider`。
//!   一个厂商一个子目录（`providers/github/`、未来 `gitee/`、`gitlab/`…）。
//! - [`registry::ProviderRegistry`]：由 `AppConfig` 构建、按 provider 名分发的唯一入口。
//!   业务层（brier-api）只依赖本注册表，不感知具体厂商实现。
//!
//! 新增厂商三步：实现两个 trait → `registry::from_config` 注册一行 → 配置 .env。

pub mod providers;
pub mod registry;

pub use providers::github::GithubProvider;
pub use registry::ProviderRegistry;
