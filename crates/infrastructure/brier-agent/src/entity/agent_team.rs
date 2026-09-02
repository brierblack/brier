use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "agent_teams")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub creator_id: Uuid,
    pub primary_agent_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub mode: String,
    pub status: String,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::agent::Entity",
        from = "Column::PrimaryAgentId",
        to = "super::agent::Column::Id"
    )]
    PrimaryAgent,
    #[sea_orm(has_many = "super::agent_team_member::Entity")]
    AgentTeamMember,
}

impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PrimaryAgent.def()
    }
}

impl Related<super::agent_team_member::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AgentTeamMember.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
