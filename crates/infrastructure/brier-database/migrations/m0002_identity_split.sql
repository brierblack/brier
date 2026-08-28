-- ============================================================
-- m0002: 用户表去厂商化 + user_identities 拆分
--
-- 背景：m0001 的 users 表包含 GitHub 专属字段（github_id / login /
--       github_access_token），阻碍多 Provider 登录（手机号/Gitee/GitLab）。
-- 目标：
--   * users    → 账户本体：username / name / email / phone / password_hash /
--                avatar_url / status / last_login_at
--   * 新增 user_identities → 第三方身份：(provider, provider_uid) 唯一
--
-- 幂等性：新库（init.sql 已含目标结构）执行本迁移时全部语句空跑；
--         旧库（m0001 旧结构）执行本迁移完成数据迁移。
-- ============================================================

-- 1. user_identities 表（不存在则创建）
CREATE TABLE IF NOT EXISTS user_identities (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider     TEXT NOT NULL CHECK (provider IN ('github', 'gitee', 'gitlab')),
    provider_uid TEXT NOT NULL,
    access_token TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_uid)
);

-- 2. 回填：仅旧结构（存在 github_id 列）时，将现有 GitHub 身份迁入 identities
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'github_id') THEN
        INSERT INTO user_identities (user_id, provider, provider_uid, access_token)
        SELECT id, 'github', github_id::text, github_access_token
        FROM users
        WHERE github_id IS NOT NULL
        ON CONFLICT (provider, provider_uid) DO NOTHING;
    END IF;
END $$;

-- 3. users 表新增账户本体字段（幂等）
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username       TEXT,
    ADD COLUMN IF NOT EXISTS phone          TEXT,
    ADD COLUMN IF NOT EXISTS password_hash  TEXT,
    ADD COLUMN IF NOT EXISTS status         TEXT NOT NULL DEFAULT 'active'
                                            CHECK (status IN ('active', 'disabled')),
    ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ;

-- 4. username 回填：仅旧结构（存在 login 列）时以 login 填充并去重
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'login') THEN
        UPDATE users SET username = login WHERE username IS NULL;
        -- 理论不会重复（GitHub login 全局唯一），此处为保险
        UPDATE users u SET username = u.username || '-' || substr(u.id::text, 1, 8)
        WHERE EXISTS (SELECT 1 FROM users u2
                      WHERE u2.username = u.username AND u2.id <> u.id);
        ALTER TABLE users DROP COLUMN login;
    END IF;
END $$;

-- 5. 收尾约束（幂等）
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique    ON users(phone);
CREATE INDEX IF NOT EXISTS idx_user_identities_user_id      ON user_identities(user_id);

-- 6. 删除旧 GitHub 专属列：仅旧结构存在时
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'github_id') THEN
        ALTER TABLE users
            DROP COLUMN IF EXISTS github_id,
            DROP COLUMN IF EXISTS github_access_token;
    END IF;
END $$;
