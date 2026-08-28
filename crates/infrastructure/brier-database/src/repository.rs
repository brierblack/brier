use brier_error::Result;
use brier_type::id::UserId;
use brier_type::Workspace;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait};
use sea_orm::DatabaseBackend;
use sea_orm::Statement;

use crate::convert::DbErrExt;
use crate::entity::workspace;

pub async fn create_workspace(db: &DatabaseConnection, ws: Workspace) -> Result<Workspace> {
    let active: workspace::ActiveModel = ws.into();
    let model = active.insert(db).await.map_err(DbErrExt::to_brier)?;
    Ok(model.into())
}

pub async fn list_workspaces_for_user(db: &DatabaseConnection, user_id: UserId) -> Result<Vec<Workspace>> {
    let stmt = Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        "SELECT w.* FROM workspaces w LEFT JOIN workspace_members wm ON wm.workspace_id = w.id WHERE w.creator_id = $1 OR wm.user_id = $1",
        [user_id.0.into()],
    );
    let results = workspace::Entity::find().from_raw_sql(stmt).all(db).await.map_err(DbErrExt::to_brier)?;
    Ok(results.into_iter().map(Workspace::from).collect())
}
