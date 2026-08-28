//! 各代码托管厂商适配实现。
//!
//! 一个厂商一个子目录（`github/`、未来 `gitee/`、`gitlab/`…），
//! 每个厂商的 struct 同时实现 `brier_contract` 中的认证与仓库契约。

pub mod github;
