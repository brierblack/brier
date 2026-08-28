use async_trait::async_trait;
use sea_orm::ConnectionTrait;
use sea_orm_migration::{DbErr, MigrationName, MigrationTrait, MigratorTrait, SchemaManager};

const UP_SQL: &str = include_str!("../migrations/init.sql");

const DOWN_SQL: &str = "
DROP TABLE IF EXISTS agent_team_members;
DROP TABLE IF EXISTS workspace_members;
DROP TABLE IF EXISTS agent_teams;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS work_computers;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS users;
";

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "init"
    }
}

#[async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager.get_connection().execute_unprepared(UP_SQL).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager.get_connection().execute_unprepared(DOWN_SQL).await?;
        Ok(())
    }
}

pub struct Migrator;

impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(Migration)]
    }
}
