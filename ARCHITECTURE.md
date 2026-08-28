# Brier 架构文档

## 1. 总览

Brier 是一个前后端分离的工作空间平台，提供 AI Agent 管理、Agent 团队协作、技能市场、自动化任务与实时聊天能力。

- **前端**：React 19 + TypeScript + Vite（`apps/web`），Ant Design v6 + Tailwind CSS v4，组件库位于 `packages/brier-ui`（`@brierb/brier-ui`）
- **后端**：Rust + Axum（`apps/server` 二进制 + `crates/*` 分层库）
- **包管理**：pnpm workspace（前端）+ Cargo workspace（后端）

## 2. 后端 crates 分层

### 2.1 分层规则

- **以文件夹层级组织**：目录结构即依赖结构，新 crate 必须落入对应层
- **禁止同层依赖**：同一层内的 crate 不允许互相引用
- **依赖只指向更低层**：允许跨层依赖，但优先逐层
- **foundation 层零业务依赖**：只允许依赖纯第三方工具库

### 2.2 目录结构

```
crates/
├── foundation/          # L0 基础层
│   └── brier-error/     # 统一错误类型 BrierError / Result，零业务依赖
├── primitives/          # L1 原语层
│   ├── brier-type/      # 领域类型：User/Workspace/Agent/Team/ID/枚举/隧道消息
│   └── brier-config/    # 配置加载
├── domain/              # L2 领域层
│   └── brier-core/      # 领域抽象：auth(UserInfo/AuthProvider)、tunnel(ConnectionRegistry)
├── infrastructure/      # L3 基础设施层
│   ├── brier-database/  # 持久化：连接、迁移、实体、仓储、模型转换
│   ├── brier-github-auth/  # GitHub OAuth 适配
│   └── brier-jwt/       # 会话令牌：签发/验证，验证策略集中（HS256）
└── application/         # L4 应用层
    └── brier-api/       # HTTP 接口：路由、中间件、应用状态、登录编排

apps/
└── server/              # L5 入口层（二进制）：装配与启动
```

### 2.3 依赖矩阵

| crate             | 层  | 内部依赖                                             |
| ----------------- | --- | ---------------------------------------------------- |
| brier-error       | L0  | -                                                    |
| brier-type        | L1  | brier-error                                          |
| brier-config      | L1  | brier-error                                          |
| brier-core        | L2  | brier-error, brier-type                              |
| brier-database    | L3  | brier-error, brier-type                              |
| brier-github-auth | L3  | brier-error, brier-config, brier-core                |
| brier-jwt         | L3  | brier-error                                          |
| brier-api         | L4  | 全部下层                                             |
| apps/server       | L5  | brier-api, brier-config, brier-database, brier-error |

### 2.4 各 crate 职责

- **brier-error**：统一错误枚举（Config/Auth/Provider/Jwt/Server/Database/NotFound/Validation/Io）。`Auth` 表示认证流程失败，`Provider` 表示外部 Provider（GitHub 等）API 通信失败，与具体厂商解耦。错误层不依赖任何业务 crate 与 ORM；数据库错误的转换由 `brier-database` 通过本地 trait `DbErrExt::to_brier` 显式完成
- **brier-type**：纯数据类型与领域枚举（含 `tunnel::ServerMessage`），跨层共享，无副作用
- **brier-config**：环境配置读取与校验
- **brier-core**：领域抽象与状态持有——`auth::UserInfo`/`AuthProvider` trait、`tunnel::ConnectionRegistry`（实时连接注册表）
- **brier-database**：sea-orm 连接、迁移、实体模型、仓储函数，以及 entity ↔ 领域类型转换
- **brier-github-auth**：实现 `AuthProvider`，封装 GitHub OAuth 授权与 API 调用
- **brier-jwt**：会话令牌的签发与验证（`JwtSigner`/`JwtVerifier`），验证策略（HS256、leeway、必需 exp/iat）集中于此；`SessionClaims` 仅含 `sub`（用户 UUID）/`iat`/`exp`/`jti`，profile 信息一律从数据库读取
- **brier-api**：Axum 路由（auth/workspace/github 等）、全局状态、登录编排（何时/给谁签发）、HTTP 错误映射

## 3. 关键设计决策

### 3.1 错误层与 ORM 解耦

`brier-error` 不再依赖 `sea-orm`。`sea_orm::DbErr` → `BrierError` 的转换：

```rust
// brier-database/src/convert.rs
pub trait DbErrExt {
    fn to_brier(self) -> BrierError;
}

impl DbErrExt for sea_orm::DbErr {
    fn to_brier(self) -> BrierError {
        BrierError::Database(self.to_string())
    }
}
```

使用方式：`query.await.map_err(DbErrExt::to_brier)?`

### 3.2 依赖方向约束

- 禁止出现同层 crate 互相 `use`
- 禁止高层 crate 被低层 crate 依赖
- 新增 crate 时按 2.2 结构落位，并在依赖声明前校验层级

## 4. 前端目录结构（摘要）

```
apps/web/src/
├── pages/Space/           # 空间页面：Chat/Agents/Team/Skills/Automation/AgentTasks/Settings/New
├── components/            # 布局组件：NavMenu/WorkSpace/WorkComputer/Logo/StatusBadge/RuntimeIcon
├── data/mockData.ts       # 前端 mock 数据
├── services/              # API 服务层
├── types.ts / define.tsx  # 类型与常量
└── auth-context.tsx       # GitHub 登录上下文
```

## 5. 数据流示例

### 账户模型（users + user_identities）

- `users`：账户本体，与具体登录厂商解耦。字段：`username`（唯一）、`name`、`email`、`phone`（唯一，预留手机号登录）、`password_hash`（预留本地凭证）、`avatar_url`、`status`（active/disabled）、`last_login_at`。`password_hash` 属敏感凭证，仅存在于数据库实体，不进入 `brier-type::User` API 模型。
- `user_identities`：第三方身份，`(provider, provider_uid)` 唯一。`provider` 目前支持 `github`/`gitee`/`gitlab`，`access_token` 随身份存储。接入新 OAuth 厂商时仅需新增身份记录，无需改动 users 表。
- 登录编排：`find_or_create_user_by_identity(provider, provider_uid, profile, token)`——已存在则更新资料与 `last_login_at`；不存在则在事务内创建 user + identity。
- 迁移：`migrations/` 目录按序执行（`init` → `identity_split`），迁移文件列表化，后续 schema 变更新增 `m0003_*.sql` 并在 `migration.rs` 注册。

GitHub 登录：`apps/server` → `brier-api::routes/auth` → `brier-github-auth`（exchange_code/get_user）→ `brier-database::repository`（find_or_create_user_by_identity：按 `(provider, provider_uid)` 查找/创建用户与身份，事务内完成）→ `brier-api` 构造 `SessionClaims`（`sub` = 用户 UUID）并交由 `brier-jwt::JwtSigner` 签发 → 后续 `/api/auth/me` 与 `current_user` 均用 `JwtVerifier` 验证后按 UUID 查库返回最新资料。
