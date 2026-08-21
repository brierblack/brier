use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "workspace_members")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub workspace_id: Uuid,
    #[sea_orm(primary_key)]
    pub user_id: Uuid,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::workspace::Entity",
        from = "Column::WorkspaceId",
        to = "super::workspace::Column::Id"
    )]
    Workspace,
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id"
    )]
    User,
}

impl Related<super::workspace::Entity> for Entity {
    fn to_relation() -> Relation {
        Relation::Workspace
    }
}

impl Related<super::user::Entity> for Entity {
    fn to_relation() -> Relation {
        Relation::User
    }
}

impl ActiveModelBehavior for ActiveModel {}
