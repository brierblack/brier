use sea_orm::entity::prelude::*;

/// 用户接入令牌（BRIER_TOKEN）：每用户一个活动令牌，刷新即替换。
/// 仅存 SHA-256 哈希，原文只在生成时返回一次。
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "user_connect_tokens")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub user_id: Uuid,
    pub token_hash: String,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
