//! 数据库 schema 与连接管理（纯基础设施，不含业务实体或仓储逻辑）。
//!
//! 职责：数据库迁移文件（SQL）集中管理、连接建立、迁移执行。
//! 业务实体与仓储由 brier-user / brier-workspace / brier-agent 各自承载。

pub mod connection;
pub mod migration;

pub use connection::{connect, run_migrations};
