-- ============================================================
-- m0005: Agent 任务（agent_tasks）
--
-- 任务 = 把指令下发到 Agent 绑定的工作电脑上执行，输出聚合回传。
-- - prompt 模式：发给 runtime（AI CLI）的自然语言指令，由 CLI 拼参数
-- - command 模式：显式 shell 命令（高级用法，绕过 runtime）
-- 状态机：pending → running → completed | failed | cancelled
-- 输出先聚合到 output 单字段，满足 MVP；后续需要结构化再拆 task_outputs。
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    creator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    computer_id UUID REFERENCES work_computers(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    prompt      TEXT,
    command     TEXT,
    runtime     TEXT,
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('high', 'medium', 'low')),
    source      TEXT NOT NULL DEFAULT 'manual'
                CHECK (source IN ('manual', 'automation')),
    output      TEXT NOT NULL DEFAULT '',
    exit_code   INT,
    error       TEXT,
    started_at  TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_tasks_workspace_id ON agent_tasks(workspace_id);
CREATE INDEX idx_agent_tasks_agent_id     ON agent_tasks(agent_id);
CREATE INDEX idx_agent_tasks_creator_id   ON agent_tasks(creator_id);
CREATE INDEX idx_agent_tasks_status       ON agent_tasks(status);
