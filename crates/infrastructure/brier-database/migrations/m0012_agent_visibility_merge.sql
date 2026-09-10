-- ============================================================
-- m0012: agents.visibility + public_scope → 单一 visibility 枚举
--
-- 背景：visibility（private/public）与 public_scope（all/joined_spaces/
--       specified_spaces）强耦合——public_scope 仅在 visibility=public 时
--       有意义，前端也一直把两者合成一个可见性档位。合并为单字段：
--         private                  ← private
--         public_all               ← public + all（或 public_scope IS NULL 兜底）
--         public_joined_spaces     ← public + joined_spaces
--         public_specified_spaces  ← public + specified_spaces
--
-- 幂等性：仅旧结构（存在 public_scope 列）时执行列合并；新库
--         （init.sql 已含目标结构）空跑，只做约束收尾。
-- ============================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'agents' AND column_name = 'public_scope') THEN
        ALTER TABLE agents ADD COLUMN visibility_new TEXT;

        UPDATE agents
        SET visibility_new = CASE
            WHEN visibility = 'private' THEN 'private'
            WHEN visibility = 'public' AND public_scope = 'joined_spaces' THEN 'public_joined_spaces'
            WHEN visibility = 'public' AND public_scope = 'specified_spaces' THEN 'public_specified_spaces'
            WHEN visibility = 'public' THEN 'public_all'
            ELSE 'private'
        END;

        ALTER TABLE agents DROP COLUMN public_scope;
        ALTER TABLE agents DROP COLUMN visibility;
        ALTER TABLE agents RENAME COLUMN visibility_new TO visibility;
    END IF;
END $$;

-- 约束收尾（幂等）：替换旧 CHECK 为四值枚举
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_visibility_check;
ALTER TABLE agents ALTER COLUMN visibility SET NOT NULL;
ALTER TABLE agents ADD CONSTRAINT agents_visibility_check
    CHECK (visibility IN ('private', 'public_all', 'public_joined_spaces', 'public_specified_spaces'));
