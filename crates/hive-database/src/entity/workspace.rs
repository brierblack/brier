use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "workspaces")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub creator_id: Uuid,
    pub name: String,
    #[sea_orm(unique)]
    pub slug: String,
    pub description: Option<String>,
    pub avatar: Option<String>,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::CreatorId",
        to = "super::user::Column::Id"
    )]
    Creator,
    #[sea_orm(has_many = "super::agent::Entity")]
    Agent,
    #[sea_orm(has_many = "super::agent_team::Entity")]
    AgentTeam,
    #[sea_orm(has_many = "super::workspace_member::Entity")]
    WorkspaceMember,
}

impl Related<super::user::Entity> for Entity {
    fn to_relation() -> Relation {
        Relation::Creator
    }
}

impl Related<super::agent::Entity> for Entity {
    fn to_relation() -> Relation {
        Relation::Agent
    }
}

impl Related<super::agent_team::Entity> for Entity {
    fn to_relation() -> Relation {
        Relation::AgentTeam
    }
}

impl Related<super::workspace_member::Entity> for Entity {
    fn to_relation() -> Relation {
        Relation::WorkspaceMember
    }
}

impl ActiveModelBehavior for ActiveModel {}
