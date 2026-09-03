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

// ---------------------------------------------------------------------------
// m0003: work_computer 隧道接入能力
// user_connect_tokens（每用户活动接入令牌）+ work_computers 心跳/运行时落点
// ---------------------------------------------------------------------------

const WORK_COMPUTER_TUNNEL_SQL: &str =
    include_str!("../migrations/m0003_work_computer_tunnel.sql");

pub struct WorkComputerTunnelMigration;

impl MigrationName for WorkComputerTunnelMigration {
    fn name(&self) -> &str {
        "work_computer_tunnel"
    }
}

#[async_trait]
impl MigrationTrait for WorkComputerTunnelMigration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(WORK_COMPUTER_TUNNEL_SQL)
            .await?;
        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        // 列级迁移不可逆：不回退已存的心跳/令牌数据
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// m0004: work_computer 接入客户端版本
// ---------------------------------------------------------------------------

const WORK_COMPUTER_VERSION_SQL: &str =
    include_str!("../migrations/m0004_work_computer_version.sql");

pub struct WorkComputerVersionMigration;

impl MigrationName for WorkComputerVersionMigration {
    fn name(&self) -> &str {
        "work_computer_version"
    }
}

#[async_trait]
impl MigrationTrait for WorkComputerVersionMigration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(WORK_COMPUTER_VERSION_SQL)
            .await?;
        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}

pub struct Migrator;

impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(Migration),
            Box::new(IdentitySplitMigration),
            Box::new(WorkComputerTunnelMigration),
            Box::new(WorkComputerVersionMigration),
        ]
    }
}
