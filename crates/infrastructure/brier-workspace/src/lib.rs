//! 工作空间上下文聚合包（自包含，与 brier-database / brier-agent 零依赖）。
//!
//! 职责：workspaces / workspace_members 两表的实体映射、entity ↔ 领域类型转换、
//! 工作空间创建/查询等仓储函数。

pub mod convert;
pub mod entity;
pub mod repository;

pub use convert::DbErrExt;
