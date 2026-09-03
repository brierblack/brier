-- ============================================================
-- m0004: work_computer 接入客户端版本
--
-- CLI（brier daemon）在 Auth 上报时携带自身版本（package.json version），
-- 前端 ServiceUpgradeCard 据此展示电脑上的 daemon 版本。
--
-- 幂等性：新库（init.sql 已含目标结构）执行本迁移时语句空跑。
-- ============================================================

ALTER TABLE work_computers
    ADD COLUMN IF NOT EXISTS version TEXT;
