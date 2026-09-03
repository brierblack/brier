use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "agent_tasks")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub creator_id: Uuid,
    pub agent_id: Uuid,
    pub computer_id: Option<Uuid>,
    pub title: String,
    pub prompt: Option<String>,
    pub command: Option<String>,
    pub runtime: Option<String>,
    pub status: String,
    pub priority: String,
    pub source: String,
    pub output: String,
    pub exit_code: Option<i32>,
    pub error: Option<String>,
    pub started_at: Option<DateTimeUtc>,
    pub finished_at: Option<DateTimeUtc>,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::agent::Entity",
        from = "Column::AgentId",
        to = "super::agent::Column::Id"
    )]
    Agent,
    #[sea_orm(
        belongs_to = "super::work_computer::Entity",
        from = "Column::ComputerId",
        to = "super::work_computer::Column::Id"
    )]
    WorkComputer,
}

impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Agent.def()
    }
}

impl Related<super::work_computer::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::WorkComputer.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
