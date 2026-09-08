-- ============================================================
-- m0009: agents.work_computer_name（工作电脑名冗余，绑定时写入）
--
-- 详情页需要展示工作电脑名，而 Agent 仅存 work_computer_id；
-- 冗余一份名字，在创建/绑定/换绑电脑时随 work_computer_id 一起写入，
-- 删除电脑时与 FK 置空同步清空（见 repository::delete_work_computer）。
-- 对新库（init.sql 已含该列）幂等空跑；对旧库回填存量绑定关系。
-- ============================================================

ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS work_computer_name TEXT;

UPDATE agents a
SET work_computer_name = wc.name
FROM work_computers wc
WHERE a.work_computer_id = wc.id
  AND a.work_computer_name IS DISTINCT FROM wc.name;
