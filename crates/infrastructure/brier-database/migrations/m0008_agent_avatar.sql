-- ============================================================
-- m0008: agents.icon/color → agents.avatar（头像图片 base64/URL）
--
-- 旧字段语义不再使用（icon 为 emoji 字符、color 为背景色，前端展示
-- 统一由 avatar 图片承载），删除两列。对新库（init 已含 avatar 列）
-- 幂等空跑。
-- ============================================================

ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS avatar TEXT;

ALTER TABLE agents
    DROP COLUMN IF EXISTS icon,
    DROP COLUMN IF EXISTS color;
