use async_trait::async_trait;
use sea_orm::{ConnectionTrait, Statement};
use sea_orm_migration::{DbErr, DeriveMigrationName, MigrationTrait, SchemaManager};

#[derive(DeriveMigrationName)]
pub struct Migration;

const UP_SQL: &str = r#"
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id   BIGINT NOT NULL UNIQUE,
    login       TEXT NOT NULL,
    name        TEXT,
    email       TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    avatar      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_computers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    computer_type TEXT NOT NULL CHECK (computer_type IN ('local', 'ssh', 'cloud')),
    host          TEXT NOT NULL,
    os            TEXT NOT NULL,
    status        TEXT NOT NULL CHECK (status IN ('online', 'offline')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    creator_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    work_computer_id UUID REFERENCES work_computers(id) ON DELETE SET NULL,
    name             TEXT NOT NULL,
    description      TEXT,
    icon             TEXT,
    color            TEXT,
    status           TEXT NOT NULL CHECK (status IN ('online', 'offline', 'connecting')),
    visibility       TEXT NOT NULL CHECK (visibility IN ('private', 'public')),
    public_scope     TEXT CHECK (public_scope IN ('all', 'joined_spaces', 'specified_spaces')),
    runtime          TEXT,
    last_active      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_teams (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    creator_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    primary_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    name             TEXT NOT NULL,
    description      TEXT,
    mode             TEXT NOT NULL CHECK (mode IN ('coordinator', 'sequential', 'graph')),
    status           TEXT NOT NULL CHECK (status IN ('available', 'unavailable')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS agent_team_members (
    team_id    UUID NOT NULL REFERENCES agent_teams(id) ON DELETE CASCADE,
    agent_id   UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, agent_id)
);

CREATE INDEX idx_workspaces_creator_id        ON workspaces(creator_id);
CREATE INDEX idx_work_computers_user_id       ON work_computers(user_id);
CREATE INDEX idx_agents_workspace_id          ON agents(workspace_id);
CREATE INDEX idx_agents_creator_id           ON agents(creator_id);
CREATE INDEX idx_agents_work_computer_id     ON agents(work_computer_id);
CREATE INDEX idx_agent_teams_workspace_id     ON agent_teams(workspace_id);
CREATE INDEX idx_agent_teams_creator_id       ON agent_teams(creator_id);
CREATE INDEX idx_agent_teams_primary_agent_id ON agent_teams(primary_agent_id);
"#;

const DOWN_SQL: &str = r#"
DROP TABLE IF EXISTS agent_team_members;
DROP TABLE IF EXISTS workspace_members;
DROP TABLE IF EXISTS agent_teams;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS work_computers;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS users;
"#;

#[async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute(Statement::from_string(
                manager.get_database_backend(),
                UP_SQL,
            ))
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute(Statement::from_string(
                manager.get_database_backend(),
                DOWN_SQL,
            ))
            .await?;
        Ok(())
    }
}
