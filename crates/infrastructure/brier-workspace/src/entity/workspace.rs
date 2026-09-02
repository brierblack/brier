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
    pub instructions: Option<String>,
    pub repositories: Option<Json>,
    pub auto_pr_review: bool,
    pub auto_issue_assign: bool,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::workspace_member::Entity")]
    WorkspaceMember,
}

impl Related<super::workspace_member::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::WorkspaceMember.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
