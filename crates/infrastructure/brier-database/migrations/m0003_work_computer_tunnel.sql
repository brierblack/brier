-- ============================================================
-- m0003: work_computer 隧道接入能力
--
-- 背景：/tunnel WebSocket 只做连接注册与日志，CLI 上报的
--       hostname/os/runtimes 无落库消费者，REST 手动添加与
--       CLI 隧道上报两条链路脱节。
-- 目标：
--   * 新增 user_connect_tokens → 每用户一个活动接入令牌
--     （BRIER_TOKEN，hash 存储；刷新即替换）
--   * work_computers 增加 last_seen_at（心跳落点）与
--     runtimes（CLI 上报的运行时列表，JSON 文本）
--
-- 幂等性：新库（init.sql 已含目标结构）执行本迁移时全部语句空跑。
-- ============================================================

-- 1. 用户接入令牌表（每用户唯一，刷新覆盖）
CREATE TABLE IF NOT EXISTS user_connect_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. work_computers 增加心跳与运行时落点
ALTER TABLE work_computers
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS runtimes     TEXT;

-- 3. (user_id, host) 唯一识别一台电脑（CLI Auth 按 hostname upsert）
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_computers_user_host
    ON work_computers(user_id, host);
