//! 领域契约包（Domain Contracts）。
//!
//! 只存放**行为契约**：trait 及其强绑定类型。无任何实现、无状态、无副作用，
//! 是全仓库变更敏感度最低的包之一，供实现层（brier-forge 等）与消费层
//! （brier-api 等）共同依赖——这就是依赖倒置的落点。
//!
//! - [`auth`]：`OAuthProvider`（登录认证）+ `ProviderIdentity`（身份数据）
//! - [`repo`]：`RepositoryProvider`（代码资源访问）+ `RepoInfo`（仓库视图）
//!
//! 与 `brier-type`（L1 纯数据形状）的区别：type 是"是什么"，contract 是"能做什么"。

pub mod auth;
pub mod repo;
