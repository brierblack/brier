use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "agent_team_members")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub team_id: Uuid,
    #[sea_orm(primary_key)]
    pub agent_id: Uuid,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::agent_team::Entity",
        from = "Column::TeamId",
        to = "super::agent_team::Column::Id"
    )]
    Team,
    #[sea_orm(
        belongs_to = "super::agent::Entity",
        from = "Column::AgentId",
        to = "super::agent::Column::Id"
    )]
    Agent,
}

impl Related<super::agent_team::Entity> for Entity {
    fn to_relation() -> Relation {
        Relation::Team
    }
}

impl Related<super::agent::Entity> for Entity {
    fn to_relation() -> Relation {
        Relation::Agent
    }
}

impl ActiveModelBehavior for ActiveModel {}
