use chrono::Utc;
use brier_error::Result;
use brier_type::id::UserId;
use brier_type::{User, Workspace};
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use sea_orm::DatabaseBackend;
use sea_orm::Statement;

use crate::convert::DbErrExt;
use crate::entity::{user, workspace};

pub async fn find_user_by_github_id(db: &DatabaseConnection, github_id: i64) -> Result<Option<User>> {
    let model = user::Entity::find()
        .filter(user::Column::GithubId.eq(github_id))
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(model.map(User::from))
}

pub async fn upsert_user_by_github_id(
    db: &DatabaseConnection,
    github_id: i64,
    login: &str,
    name: Option<&str>,
    email: Option<&str>,
    avatar_url: Option<&str>,
    github_access_token: Option<&str>,
) -> Result<User> {
    let existing = user::Entity::find()
        .filter(user::Column::GithubId.eq(github_id))
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;

    if let Some(model) = existing {
        let mut active: user::ActiveModel = model.into();
        active.login = sea_orm::Set(login.to_string());
        active.name = sea_orm::Set(name.map(|s| s.to_string()));
        active.email = sea_orm::Set(email.map(|s| s.to_string()));
        active.avatar_url = sea_orm::Set(avatar_url.map(|s| s.to_string()));
        active.github_access_token = sea_orm::Set(github_access_token.map(|s| s.to_string()));
        active.updated_at = sea_orm::Set(Utc::now());
        let model = active.update(db).await.map_err(DbErrExt::to_brier)?;
        Ok(model.into())
    } else {
        let active = user::ActiveModel {
            github_id: sea_orm::Set(github_id),
            login: sea_orm::Set(login.to_string()),
            name: sea_orm::Set(name.map(|s| s.to_string())),
            email: sea_orm::Set(email.map(|s| s.to_string())),
            avatar_url: sea_orm::Set(avatar_url.map(|s| s.to_string())),
            github_access_token: sea_orm::Set(github_access_token.map(|s| s.to_string())),
            ..Default::default()
        };
        let model = active.insert(db).await.map_err(DbErrExt::to_brier)?;
        Ok(model.into())
    }
}

pub async fn get_github_token(db: &DatabaseConnection, user_id: UserId) -> Result<Option<String>> {
    let model = user::Entity::find_by_id(user_id.0)
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?
        .ok_or_else(|| brier_error::BrierError::NotFound("user not found".into()))?;
    Ok(model.github_access_token)
}

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
