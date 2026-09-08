use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "agents")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub creator_id: Uuid,
    pub work_computer_id: Option<Uuid>,
    pub work_computer_name: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub avatar: Option<String>,
    pub status: String,
    pub visibility: String,
    pub public_scope: Option<String>,
    pub runtime: Option<String>,
    pub model: Option<String>,
    pub workdir: Option<String>,
    pub last_active: Option<DateTimeUtc>,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::work_computer::Entity",
        from = "Column::WorkComputerId",
        to = "super::work_computer::Column::Id"
    )]
    WorkComputer,
    #[sea_orm(has_many = "super::agent_team_member::Entity")]
    AgentTeamMember,
}

impl Related<super::work_computer::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::WorkComputer.def()
    }
}

impl Related<super::agent_team_member::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AgentTeamMember.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
