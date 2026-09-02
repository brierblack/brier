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
│   ├── brier-error/     # 统一错误类型 BrierError / Result，零业务依赖
│   └── brier-crypto/    # 令牌加解密工具（AES-256-GCM），密钥经 SHA-256 派生
├── primitives/          # L1 原语层
│   ├── brier-type/      # 领域类型：User/Workspace/Agent/Team/ID/枚举/隧道消息
│   └── brier-config/    # 配置加载
├── domain/              # L2 领域层
│   ├── brier-contract/  # 领域契约：OAuthProvider/RepositoryProvider trait 及其类型
│   └── brier-core/      # 领域状态：tunnel(ConnectionRegistry 实时连接注册表)
├── infrastructure/      # L3 基础设施层
│   ├── brier-database/  # 数据库 schema（SQL 迁移）+ 连接管理与迁移执行（不含业务实体/仓储）
│   ├── brier-user/      # 用户上下文聚合包：users/user_identities 实体、转换、仓储、规则
│   ├── brier-workspace/ # 工作空间上下文聚合包：workspaces/workspace_members 实体、转换、仓储
│   ├── brier-agent/     # Agent 上下文聚合包：agents/agent_teams/agent_team_members/work_computers 实体、转换
│   ├── brier-forge/     # 代码托管平台适配：github/gitee 厂商实现（OAuth+仓库 API）、ProviderRegistry
│   └── brier-jwt/       # 会话令牌：签发/验证，验证策略集中（HS256）
└── application/         # L4 应用层
    └── brier-api/       # HTTP 接口：路由、中间件、应用状态、登录编排

apps/
└── server/              # L5 入口层（二进制）：装配与启动
```

### 2.3 依赖矩阵

| crate           | 层  | 内部依赖                                                                                                              |
| --------------- | --- | --------------------------------------------------------------------------------------------------------------------- |
| brier-error     | L0  | -                                                                                                                     |
| brier-crypto    | L0  | brier-error                                                                                                           |
| brier-type      | L1  | brier-error                                                                                                           |
| brier-config    | L1  | brier-error                                                                                                           |
| brier-core      | L2  | brier-type                                                                                                            |
| brier-contract  | L2  | brier-error                                                                                                           |
| brier-database  | L3  | brier-error                                                                                                           |
| brier-user      | L3  | brier-error, brier-crypto, brier-type                                                                                 |
| brier-workspace | L3  | brier-error, brier-type                                                                                               |
| brier-agent     | L3  | brier-error, brier-type                                                                                               |
| brier-forge     | L3  | brier-error, brier-config, brier-contract                                                                             |
| brier-jwt       | L3  | brier-error                                                                                                           |
| brier-api       | L4  | brier-core, brier-contract, brier-error, brier-config, brier-crypto, brier-forge, brier-workspace, brier-type, brier-user, brier-jwt |
| apps/server     | L5  | brier-api, brier-config, brier-database, brier-error                                                                  |

> 注：L3 上下文聚合包（brier-user / brier-workspace / brier-agent）同层且**互不依赖**，各自自包含实体/转换/仓储。brier-database 仅承载 schema 与连接管理，不含业务实体。brier-api 不直接依赖 brier-database——连接与迁移由 apps/server 调用，业务数据访问走 brier-workspace / brier-user 等聚合包。

### 2.4 各 crate 职责

- **brier-error**：统一错误枚举（Config/Auth/Provider/Jwt/Server/Database/NotFound/Validation/Io）。`Auth` 表示认证流程失败，`Provider` 表示外部 Provider（GitHub 等）API 通信失败，与具体厂商解耦。错误层不依赖任何业务 crate 与 ORM；数据库错误的转换由各上下文聚合包通过本地 trait `DbErrExt::to_brier` 显式完成
- **brier-crypto**：令牌加解密工具（AES-256-GCM）。`TokenCipher` 从 `TOKEN_ENCRYPTION_KEY` 环境变量经 SHA-256 派生 32 字节密钥，提供 `encrypt` / `decrypt` / `decrypt_or_raw`（兼容历史明文令牌，下次登录自动加密）。与 `JWT_SECRET` 独立，不复用
- **brier-type**：纯数据类型与领域枚举（含 `tunnel::ServerMessage`），跨层共享，无副作用
- **brier-config**：环境配置读取与校验。`providers: HashMap<String, OAuthConfig>`（github 必填，gitee/gitlab 等三变量齐全才注册）；`cookie_secure` 控制会话 Cookie 的 Secure 属性
- **brier-contract**：领域契约包（自包含、零状态、零副作用）——`auth::OAuthProvider` trait（authorize_url / exchange_code / fetch_identity，返回 `ProviderIdentity`）、`repo::RepositoryProvider` trait（list_repos 等代码资源访问，`RepoInfo` 随 trait 同居）。实现层（brier-forge）与消费层（brier-api）共同依赖，是全仓库变更敏感度最低的包之一；与 `brier-type` 的区别：type 是"是什么"（数据形状），contract 是"能做什么"（行为契约）
- **brier-core**：领域状态与运行时对象——`tunnel::ConnectionRegistry`（实时连接注册表，`Arc<RwLock<HashMap>>` + mpsc，向已注册连接发送 `brier_type::tunnel::ServerMessage`）。与 brier-contract 同层且零依赖
- **brier-database**：仅承载数据库 schema（SQL 迁移文件集中管理）、连接建立与迁移执行。不含任何业务实体、类型转换或仓储逻辑——各上下文聚合包（brier-user / brier-workspace / brier-agent）各自管理实体与仓储。`DbErrExt` 内联于 `connection.rs`，仅服务于连接与迁移的错误转换
- **brier-user**：用户上下文聚合包（自包含）。`users`/`user_identities` 两表的实体映射、entity ↔ `brier-type::User` 转换、`find_or_create_user_by_identity`/`find_user_by_id`/`get_provider_token` 等仓储函数、username 唯一化规则。不感知任何登录厂商，厂商仅作为 provider 字符串参数。access_token 经 `brier-crypto::TokenCipher` 在写入时加密、读取时解密，`decrypt_or_raw` 兼容历史明文令牌
- **brier-workspace**：工作空间上下文聚合包（自包含）。`workspaces`/`workspace_members` 两表的实体映射、entity ↔ `brier-type::Workspace`/`WorkspaceMember` 转换、`create_workspace`/`get_workspace_for_user`/`list_workspaces_for_user` 仓储函数。与 brier-user / brier-agent 零依赖
- **brier-agent**：Agent 上下文聚合包（自包含）。`agents`/`agent_teams`/`agent_team_members`/`work_computers` 四表的实体映射、entity ↔ 领域类型转换。仓储函数按需补充。与 brier-user / brier-workspace 零依赖
- **brier-forge**：代码托管平台适配层。`providers/github` 与 `providers/gitee` 各自实现 `OAuthProvider` 与 `RepositoryProvider`（封装 OAuth 授权、身份与仓库 API；`oauth_base`/`api_base` 可指向 mock server 以支持单元测试）。`ProviderRegistry` 由 `AppConfig` 构建，按 provider 名分发认证与仓库两类能力；新增厂商（GitLab…）实现两个 trait 后在 `from_config` 注册一行即可，brier-api 与前端零改动
- **brier-jwt**：会话令牌的签发与验证（`JwtSigner`/`JwtVerifier`），验证策略（HS256、leeway、必需 exp/iat）集中于此；`SessionClaims` 仅含 `sub`（用户 UUID）/`iat`/`exp`/`jti`，profile 信息一律从数据库读取
- **brier-api**：Axum 路由（auth/workspace/forge 等）、全局状态、登录编排（何时/给谁签发）、HTTP 错误映射。`AppState.providers` 为代码托管平台适配注册表（`brier_forge::ProviderRegistry`），动态路由 `/api/auth/{provider}/login|callback` 与 `/api/{provider}/repos` 均从注册表分发，未注册的 provider 返回 404；登录编排只依赖 `brier_contract::auth::OAuthProvider`，仓库 API 只依赖 `brier_contract::repo::RepositoryProvider`，实时连接状态来自 `brier_core::tunnel::ConnectionRegistry`，不感知具体厂商实现。用户数据访问走 `brier-user::repository`，工作空间数据访问走 `brier-workspace::repository`——不直接依赖 brier-database

## 3. 关键设计决策

### 3.1 错误层与 ORM 解耦

`brier-error` 不再依赖 `sea-orm`。`sea_orm::DbErr` → `BrierError` 的转换由各上下文聚合包通过本地 trait `DbErrExt` 显式完成，遵循"每个自包含 crate 自带错误转换"原则：

```rust
// 各聚合包的 convert.rs（brier-user / brier-workspace / brier-agent）
// brier-database 的 connection.rs 内联了同一 trait，仅服务于连接与迁移
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

### 3.2 OAuth 令牌加密存储

第三方 OAuth access_token 不明文存储，经 AES-256-GCM 加密后写入 `user_identities.access_token`：

- **密钥独立**：`TOKEN_ENCRYPTION_KEY` 环境变量经 SHA-256 派生为 32 字节 AES 密钥，不复用 `JWT_SECRET`
- **加密格式**：base64(12 字节随机 nonce + ciphertext + GCM tag)，每次加密结果不同
- **透明加解密**：`brier-user::repository` 写入时调 `TokenCipher::encrypt`，读取时调 `decrypt_or_raw`
- **向后兼容**：`decrypt_or_raw` 解密失败时返回原始值（历史明文令牌），下次登录时自动重新加密
- **密钥位置**：`TokenCipher` 在 `AppState` 中构造，由 `brier-api` 传递给 `brier-user` 仓储函数

### 3.3 依赖方向约束

- 禁止出现同层 crate 互相 `use`
- 禁止高层 crate 被低层 crate 依赖
- 新增 crate 时按 2.2 结构落位，并在依赖声明前校验层级

## 4. 前端目录结构

```
apps/web/src/
├── api/                   # API 层：generated.ts（Orval 自动生成）+ custom-instance.ts（mutator，统一 credentials 与错误映射）
├── components/            # 复用组件：NavMenu / WorkSpace / WorkComputer / Logo / Icon / StatusBadge / RuntimeIcon / AvatarUpload / ErrorBoundary / Fallback
├── context/               # 全局上下文：AuthContext/（Provider.tsx + auth.ts + index.ts）
├── data/                  # 静态数据：mockData.ts
├── Layout/                # 布局壳：index.tsx
├── pages/                 # 页面
│   ├── Login/             # 登录页
│   └── Space/             # 空间页面（空间级壳）
│       ├── Chat/          # 新会话 + 历史会话（详情视图）
│       ├── Agents/        # Agent 列表 / 详情 / 新建
│       ├── AgentTasks/    # Agent 事项（列表 + 详情视图）
│       ├── Automation/    # 自动化任务（列表 / 配置 / 详情）
│       ├── Team/          # 团队管理（创建弹窗 + 详情）
│       ├── Skills/        # 技能市场（列表 / 详情 / 新建）
│       ├── Settings/      # 空间设置
│       └── New/           # 新建空间
├── define.tsx             # 常量与定义
├── types.ts               # TypeScript 类型定义
├── App.tsx                # 根组件
├── index.tsx              # 入口
└── index.css              # 全局样式
```

## 5. 数据流示例

### 账户模型（users + user_identities）

- `users`：账户本体，与具体登录厂商解耦。字段：`username`（唯一）、`name`、`email`、`phone`（唯一，预留手机号登录）、`password_hash`（预留本地凭证）、`avatar_url`、`status`（active/disabled）、`last_login_at`。`password_hash` 属敏感凭证，仅存在于数据库实体，不进入 `brier-type::User` API 模型。
- `user_identities`：第三方身份，`(provider, provider_uid)` 唯一。`provider` 目前支持 `github`/`gitee`/`gitlab`，`access_token` 随身份存储。接入新 OAuth 厂商时仅需新增身份记录，无需改动 users 表。
- 登录编排：`find_or_create_user_by_identity(provider, provider_uid, profile, token)`——已存在则更新资料与 `last_login_at`；不存在则在事务内创建 user + identity。
- 迁移：`migrations/` 目录按序执行（`init` → `identity_split`），迁移文件列表化，后续 schema 变更新增 `m0003_*.sql` 并在 `migration.rs` 注册。

GitHub 登录：`apps/server` → `brier-api::routes/auth::provider_login`（`/api/auth/{provider}/login` 从 `AppState.providers` 注册表分发）→ 跳转 GitHub 授权页 → callback 进入 `provider_callback` → `oauth_login`（统一编排：`OAuthProvider::exchange_code` → `fetch_identity`，返回 `ProviderIdentity`）→ `brier-user::repository`（find_or_create_user_by_identity：按 `(provider, provider_uid)` 查找/创建用户与身份，事务内完成；access_token 经 `TokenCipher::encrypt` 加密后写入）→ `brier-api` 构造 `SessionClaims`（`sub` = 用户 UUID）并交由 `brier-jwt::JwtSigner` 签发 → Set-Cookie（HttpOnly + SameSite=Lax，`cookie_secure` 为 true 时加 Secure）→ 后续 `/api/auth/me` 与 `current_user` 均用 `JwtVerifier` 验证后由 `brier-user::repository::find_user_by_id` 查库返回最新资料。Forge 路由调 `get_provider_token` 时经 `decrypt_or_raw` 解密令牌后传给 `RepositoryProvider::list_repos`。

### 工作空间数据流（brier-workspace）

工作空间 CRUD 路由（`/api/workspaces`）→ `brier-api::routes::workspace`（`current_user` 鉴权后调用）→ `brier-workspace::repository`（`create_workspace` / `get_workspace_for_user` / `list_workspaces_for_user`）→ SeaORM 操作 `workspaces` + `workspace_members` 表。`brier-api` 不经过 brier-database，直接调用聚合包仓储函数。

## 6. OpenAPI 与 API 文档（utoipa）

- **链路**：handler 加 `#[utoipa::path]` → `brier-api::docs::ApiDoc` 聚合（paths + components）→ Swagger UI 挂载于 `/docs`，spec JSON 暴露于 `/api-docs/openapi.json`
- **L1/L2 保护**：`brier-type` / `brier-contract` 通过可选 feature `openapi` + `cfg_attr(feature = "openapi", derive(utoipa::ToSchema))` 提供 schema，默认不引入 utoipa；仅 `brier-api`（L4）依赖时显式开启（`brier-type = { workspace = true, features = ["openapi"] }`）
- **spec 导出**：`OPENAPI_OUT=<path> cargo test -p brier-api export_openapi_json` 生成 `openapi.json`（当前提交在 `apps/web/openapi.json`，供 Orval 等前端代码生成工具消费）；server 启动时也支持 `OPENAPI_OUT` 环境变量导出
- **前端 client 生成（Orval）**：`apps/web/orval.config.ts` 从 `openapi.json` 生成 `src/api/generated.ts`（类型 + fetch 函数）；自定义 mutator `src/api/custom-instance.ts` 统一 `credentials: 'same-origin'`（会话走 HttpOnly Cookie）与 `{ error }` 错误映射。命令：`pnpm --filter @brierb/web api:gen`（= `npx orval`）
- **新增接口**：handler 标注 `#[utoipa::path]` + 在 `docs.rs` 的 `paths(...)`/`components(schemas(...))` 注册即可自动进入文档与 spec
