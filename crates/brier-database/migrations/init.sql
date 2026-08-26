-- ============================================================
-- Brier 初始数据库 Schema
-- 数据库: PostgreSQL 16+
-- ID 策略: UUID v4 (gen_random_uuid)
-- 枚举策略: TEXT + CHECK 约束
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id           BIGINT NOT NULL UNIQUE,
    login               TEXT NOT NULL,
    name                TEXT,
    email               TEXT,
    avatar_url          TEXT,
    github_access_token TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    slug             TEXT NOT NULL UNIQUE,
    description      TEXT,
    avatar           TEXT,
    instructions     TEXT,
    repositories     JSONB NOT NULL DEFAULT '[]'::jsonb,
    auto_pr_review   BOOLEAN NOT NULL DEFAULT false,
    auto_issue_assign BOOLEAN NOT NULL DEFAULT false,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
CREATE INDEX idx_agents_creator_id            ON agents(creator_id);
CREATE INDEX idx_agents_work_computer_id      ON agents(work_computer_id);
CREATE INDEX idx_agent_teams_workspace_id     ON agent_teams(workspace_id);
CREATE INDEX idx_agent_teams_creator_id       ON agent_teams(creator_id);
CREATE INDEX idx_agent_teams_primary_agent_id ON agent_teams(primary_agent_id);
