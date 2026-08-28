//! 用户上下文聚合包（自包含，与 brier-database 零依赖）。
//!
//! 职责：users / user_identities 两张表的实体映射、entity ↔ 领域类型转换、
//! 用户创建/查找/令牌获取等仓储函数，以及 username 等用户规则。
//! 不感知任何登录厂商（GitHub/Gitee…），厂商信息仅作为 provider 字符串参数。

pub mod convert;
pub mod entity;
pub mod repository;

pub use convert::DbErrExt;
