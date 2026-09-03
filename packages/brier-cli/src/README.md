# brier-cli 源码导读

本文档描述 `packages/brier-cli/src` 的模块职责、文件关系与设计约定，便于快速上手与维护。

## 定位

brier-cli（`@brierb/brier-cli`，bin `brier`）是 Brier 平台的接入代理：通过一条 wss 长连接 `/tunnel` 连入 Brier 服务端（Rust/Axum），接收 `task-start` 后在本机 spawn AI runtime（claude/opencode/codex…）执行，并把输出/终态回传。运行时依赖仅 `ws` + `commander`，Node >= 18。

## 进程模型

```
前台 CLI（一次性命令）            后台 daemon（常驻子进程）            外部
index.ts + commands/      →    DaemonRunner.js（detached+unref）
                                ├─ DaemonContext：tunnel/index（wss 骨架）  → Brier 服务端
                                │   ├─ TaskExecutor（spawn runtime ≤3）
                                │   └─ OutputBatcher（task-output 批量发送）
                                └─ 任务输出 → 服务端落库 → 前端轮询
      经状态文件 daemon.json + 信号管理（SIGTERM→5s→SIGKILL）
```

- 前台命令把 `--server-url/--token` 写入环境变量，`DaemonManager.start` spawn 子进程
- daemon 入口以 `BRIER_DAEMON_MODE=1` 守卫，只能经 `brier daemon start` 启动

## 目录结构

```
src/
├── index.ts              # CLI 入口：commander 装配 + 版本
├── commands/             # 命令层：run / start / stop / restart / status / log
├── config/               # 配置域：load / paths / version / credentials
├── core/                 # 公共底座：logger / runtimes（零业务依赖）
├── definitions/          # 类型契约（单一来源）：tunnel / task / daemon
├── daemon/               # daemon 域：Manager / Runner / TaskExecutor / OutputBatcher / state
└── tunnel/               # 隧道域：index(骨架) / transport / heartbeat / backoff / dispatcher / url
```

## 文件功能总表

| 文件                      | 功能                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `index.ts`                | CLI 入口：注册 `daemon start/stop/restart/status/log`，`--version` 读 package.json |
| `commands/run.ts`         | `runCommand(fn)`：统一 try/catch 与失败退出码                                      |
| `commands/start.ts`       | 校验参数 → `DaemonManager.start`（spawn + 就绪握手）                               |
| `commands/stop.ts`        | `DaemonManager.stop`                                                               |
| `commands/restart.ts`     | 参数回退后 `manager.restart`                                                       |
| `commands/status.ts`      | 运行状态 + 状态文件详情展示                                                        |
| `commands/log.ts`         | 读取 `daemon.log` 最近 100 行                                                      |
| `config/load.ts`          | `loadConfig()`：env → `DaemonConfig`                                               |
| `config/paths.ts`         | 路径常量（`~/.brier` 下各文件）                                                    |
| `config/version.ts`       | 读 package.json 版本                                                               |
| `config/credentials.ts`   | 令牌 0600 持久化（start 写 / restart 读）                                          |
| `core/logger.ts`          | 文件日志（5MB 轮转），全局单例                                                     |
| `core/runtimes.ts`        | AI runtime 注册表 / 命令 / prompt flags / 绝对路径解析 / 已安装探测                |
| `definitions/tunnel.ts`   | 线协议 `StreamType/ClientMessage/ServerMessage` + 本地 `TunnelState`               |
| `definitions/task.ts`     | `TaskInfo`（消息 → 执行的中间形态）                                                |
| `definitions/daemon.ts`   | `DaemonStatus / DaemonConfig / DaemonState`                                        |
| `daemon/DaemonManager.ts` | 前台侧：spawn / 停止 / 就绪握手轮询 / 进程身份校验                                 |
| `daemon/DaemonRunner.ts`  | 子进程入口：`startDaemon(config): DaemonContext` 组合根 + main 接线                |
| `daemon/TaskExecutor.ts`  | spawn runtime、终态单报、取消升级 SIGKILL、`dispose`                               |
| `daemon/OutputBatcher.ts` | task-output micro-batching（16KB 或 50ms flush，终态前 flushTask）                 |
| `daemon/state.ts`         | 运行状态 JSON 读写 / 身份校验 / waitForProcessExit                                 |
| `tunnel/index.ts`         | 隧道骨架 `createTunnelClient(config, messageHandlers)`：状态机仲裁                 |
| `tunnel/transport.ts`     | ws 封装：事件门面 + 自动回 pong                                                    |
| `tunnel/heartbeat.ts`     | 30s 心跳节奏 + ack 超时（只上报不决策）                                            |
| `tunnel/backoff.ts`       | 指数退避纯逻辑（1s→30s，50 次）                                                    |
| `tunnel/dispatcher.ts`    | 下行消息 parse + 按 type 分发                                                      |
| `tunnel/url.ts`           | `toWsUrl`（http(s)→ws(s) + /tunnel）                                               |

## 依赖方向（单向）

```
commands → daemon(config)  →  daemon/index(Manager/readDaemonState)
daemon   → tunnel / config / core / definitions
tunnel   → core / definitions（不依赖 daemon）
config   → core / definitions
core / definitions → 仅 node 内置或零依赖
```

禁止反向引用；业务模块一律从目录 `index.ts` 统一出口导入。

## 两进程共享的数据契约

前台 CLI 与 daemon 子进程无 IPC，通过 `~/.brier/` 下文件协作：

| 文件               | 写方                                                                      | 读方                                | 说明                               |
| ------------------ | ------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------- |
| `daemon.json`      | Manager 启动时写 `ready:false`；Runner 更新 `ready/bootError/tunnelState` | Manager（就绪握手）、status/restart | 运行状态契约，结构见 `DaemonState` |
| `credentials.json` | `DaemonManager.start`（0600）                                             | `restart` 回退 token                | 令牌原文，仅属主可读写             |
| `daemon.log`       | daemon（logger）                                                          | `commands/log.ts`                   | 5MB 轮转                           |

## 线协议说明

- `definitions/tunnel.ts` 是 CLI 侧协议镜像，与服务端 Rust `brier_type::tunnel::*` serde 逐字段对齐（`type` kebab-case、字段 camelCase）；改协议两端必须同步
- 上行：`auth / heartbeat / task-output / task-complete / task-error / runtime-info`
- 下行：`auth-ok / auth-failed / heartbeat-ack / task-start / task-cancel / query-runtimes`

## 关键坑位提醒

- **`daemon/DaemonRunner` 不放入 `daemon/index.ts`**：它是入口脚本（模块顶层执行 `main()` 并校验 `BRIER_DAEMON_MODE`），被 import 会触发副作用；由 `DaemonManager` 以文件路径 spawn
- `task-output` 走 `OutputBatcher` 批量发送，**终态消息（complete/error）必须先 `flushTask`** 再上报，否则残留输出会被服务端终态过滤丢弃
- `loadConfig()` 无参，只读环境变量；CLI 参数由 `DaemonManager` 写入子进程 env
- 令牌是用户级单值：生成新令牌会使旧 token 失效（前端仅显式“获取令牌”才生成，避免误开弹窗吊销连接）

## 已知边界（供后续演进参考）

- 断线窗口的 task-output/终态不做缓冲，重连后无任务对账（任务可能滞留 running）
- 服务端输出为单行 `output ||= chunk` 追加（O(n²) 写放大），前端详情 1.5s 整包轮询——客户端批发送已落地，服务端/前端为下一阶段优化点
- daemon 50 次退避后停机无自愈；auth 握手无超时
- 路径与探测基于 `homedir()`，隐含单用户假设
