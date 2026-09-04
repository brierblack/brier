-- ============================================================
-- m0006: 会话（sessions + session_messages）
--
-- 会话 = 用户与 Agent 的对话记录；一条 user 消息触发一个 Agent 任务，
-- 任务输出回填为 agent 消息（task_id 关联 agent_tasks，可跳转任务详情）。
-- Agent 删除级联清理其会话；任务删除不删消息（task_id 置空保留记录）。
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    creator_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id     UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    title        TEXT NOT NULL DEFAULT '新会话',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'agent')),
    content         TEXT NOT NULL,
    agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,
    task_id         UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_workspace_updated ON sessions(workspace_id, updated_at DESC);
CREATE INDEX idx_sessions_agent_id          ON sessions(agent_id);
CREATE INDEX idx_session_messages_session   ON session_messages(session_id, created_at);
