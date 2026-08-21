use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub github_id: i64,
    pub login: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::workspace::Entity")]
    Workspace,
    #[sea_orm(has_many = "super::work_computer::Entity")]
    WorkComputer,
    #[sea_orm(has_many = "super::agent::Entity")]
    Agent,
    #[sea_orm(has_many = "super::agent_team::Entity")]
    AgentTeam,
}

impl Related<super::workspace::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Workspace.def()
    }
}

impl Related<super::work_computer::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::WorkComputer.def()
    }
}

impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Agent.def()
    }
}

impl Related<super::agent_team::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AgentTeam.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
