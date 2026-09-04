-- ============================================================
-- m0007: agents.workdir（任务工作目录）
--
-- Agent 任务执行时 daemon 在该目录 spawn runtime；空则继承 daemon 目录。
-- 服务端创建任务时把该值随 TaskStart.cwd 下发。
-- ============================================================

ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS workdir TEXT;
