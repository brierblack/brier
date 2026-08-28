use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "work_computers")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub computer_type: String,
    pub host: String,
    pub os: String,
    pub status: String,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id"
    )]
    User,
    #[sea_orm(has_many = "super::agent::Entity")]
    Agent,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Agent.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
