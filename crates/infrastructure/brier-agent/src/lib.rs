//! Agent 上下文聚合包（自包含，与 brier-database / brier-workspace 零依赖）。
//!
//! 职责：agents / agent_teams / agent_team_members / work_computers 四表的实体映射、
//! entity ↔ 领域类型转换，以及后续按需补充的仓储函数。

pub mod convert;
pub mod entity;
pub mod repository;

pub use convert::DbErrExt;
