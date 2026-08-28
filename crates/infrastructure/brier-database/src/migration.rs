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
DROP TABLE IF EXISTS user_identities;
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

// ---------------------------------------------------------------------------
// m0002: 用户表去厂商化 + user_identities 拆分
// 对旧库（m0001 已执行）执行数据迁移；对新库（init 已含目标结构）幂等空跑。
// ---------------------------------------------------------------------------

const IDENTITY_SPLIT_SQL: &str = include_str!("../migrations/m0002_identity_split.sql");

pub struct IdentitySplitMigration;

impl MigrationName for IdentitySplitMigration {
    fn name(&self) -> &str {
        "identity_split"
    }
}

#[async_trait]
impl MigrationTrait for IdentitySplitMigration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(IDENTITY_SPLIT_SQL)
            .await?;
        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        // 数据迁移不可逆：不回退已拆分的身份数据
        Ok(())
    }
}

pub struct Migrator;

impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(Migration),
            Box::new(IdentitySplitMigration),
        ]
    }
}
