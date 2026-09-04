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
      经状态文件 daemon.json + 信号管理（前台 stop：SIGTERM→5s→SIGKILL）
```

- 前台命令把 `--server-url/--token` 写入环境变量，`DaemonManager.start` spawn 子进程
- daemon 入口以 `BRIER_DAEMON_MODE=1` 守卫，只能经 `brier daemon start` 启动
- daemon 侧优雅停止顺序（`DaemonContext.stop`）：`flushAll 残留输出 → tunnel.stop → taskExecutor.dispose → batcher.dispose`，随后 `process.exit`

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

| 文件                      | 功能                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `index.ts`                | CLI 入口：注册 `daemon start/stop/restart/status/log`，`--version` 读 package.json             |
| `commands/run.ts`         | `runCommand(fn)`：统一 try/catch 与失败退出码                                                  |
| `commands/start.ts`       | token 校验 → `DaemonManager.start`（spawn + 就绪握手）                                         |
| `commands/stop.ts`        | `DaemonManager.stop`                                                                           |
| `commands/restart.ts`     | 回退链解析后 `manager.restart`（serverUrl：`--`→状态文件→env；token：`--`→env→credentials）    |
| `commands/status.ts`      | 运行状态 + 状态文件详情（PID/Server/Started/Ready/隧道状态）                                   |
| `commands/log.ts`         | 读取 `daemon.log` 最近 100 行                                                                  |
| `config/load.ts`          | `loadConfig()`：env → `DaemonConfig`                                                           |
| `config/paths.ts`         | 路径常量（`~/.brier` 下各文件）                                                                |
| `config/version.ts`       | 读 package.json 版本                                                                           |
| `config/credentials.ts`   | 令牌 0600 持久化（start 写 / restart 读）                                                      |
| `core/logger.ts`          | 文件日志（5MB 轮转），全局单例                                                                 |
| `core/runtimes.ts`        | AI runtime 注册表 / 命令 / prompt flags / 绝对路径解析 / 已安装探测                            |
| `definitions/tunnel.ts`   | 线协议 `StreamType/ClientMessage/ServerMessage` + 本地 `TunnelState`                           |
| `definitions/task.ts`     | `TaskInfo`（消息 → 执行的中间形态）                                                            |
| `definitions/daemon.ts`   | `DaemonStatus / DaemonConfig / DaemonState`                                                    |
| `daemon/DaemonManager.ts` | 前台侧：spawn / 停止（ESRCH 防护）/ 就绪握手轮询 / 进程身份校验 / 令牌落盘                     |
| `daemon/DaemonRunner.ts`  | 子进程入口：`startDaemon(config): DaemonContext` 组合根 + main 信号/异常接线（bootError 回写） |
| `daemon/TaskExecutor.ts`  | spawn runtime、终态单报、取消 SIGTERM→2s→SIGKILL、`dispose`                                    |
| `daemon/OutputBatcher.ts` | task-output micro-batching（16KB/50ms flush，终态前 flushTask，flush 异常防护）                |
| `daemon/state.ts`         | 运行状态 JSON 读写（严格字段校验）/ 进程身份校验 / waitForProcessExit                          |
| `tunnel/index.ts`         | 隧道骨架 `createTunnelClient(config, messageHandlers)`：状态机仲裁 + auth 握手超时             |
| `tunnel/transport.ts`     | ws 封装：事件门面 / 自动回 pong / 4MB 发送背压（send 不抛错，返回 boolean）                    |
| `tunnel/heartbeat.ts`     | 30s 心跳节奏 + ack 超时 + 发送异常防护（只上报不决策）                                         |
| `tunnel/backoff.ts`       | 指数退避纯逻辑（1s→30s，50 次，默认 full jitter）                                              |
| `tunnel/dispatcher.ts`    | 下行消息 parse + 按 type 分发                                                                  |
| `tunnel/url.ts`           | `toWsUrl`（http(s)→ws(s) + /tunnel）                                                           |

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

`restart` 回退链（与 `commands/restart.ts` 注释一致）：

- serverUrl：`--server-url` → `daemon.json.serverUrl` → 环境变量
- token：`--token` → 环境变量 → `credentials.json`

## 隧道健壮性机制

骨架 `tunnel/index.ts` 是唯一仲裁者，以下机制均为历轮加固后现状：

| 机制              | 参数                            | 行为                                                                                                                          |
| ----------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| auth 握手超时     | 10s                             | `auth` 发出后启动；`auth-ok/auth-failed/close/stop` 时清除；超时主动断开走重连，避免永久卡 `connecting`                       |
| 心跳              | 30s 间隔 / 10s ack 超时         | 仅 `auth-ok` 后启动；超时 `close(4000)` 触发重连；`setInterval` 回调异常被吞并转 `onBeatError`（防 uncaughtException 杀进程） |
| 重连退避          | 1s→30s 封顶、50 次、full jitter | 仅 `running` 时排程；`auth-ok` 归零；耗尽后 `error` 停机不再自动重连                                                          |
| 失败/停止状态区分 | `exitAsError`                   | auth 失败/重连耗尽后 close 事件保持 `error`，不被覆盖成 `disconnected`；`start()` 复位                                        |
| 发送背压          | 4MB `bufferedAmount` 上限       | `transport.send` 不抛错：未连接/超限返回 `false`；骨架 `send()` 契约稳定为 boolean                                            |
| stop 短路         | —                               | 连接已完全关闭时跳过 `waitClosed(3000)` 直接返回，`daemon stop` 不空等                                                        |

## 线协议说明

- `definitions/tunnel.ts` 是 CLI 侧协议镜像，与服务端 Rust `brier_type::tunnel::*` serde 逐字段对齐（`type` kebab-case、字段 camelCase）；改协议两端必须同步
- 上行：`auth / heartbeat / task-output / task-complete / task-error / runtime-info`
- 下行：`auth-ok / auth-failed / heartbeat-ack / task-start / task-cancel / query-runtimes`

## 关键坑位提醒

- **`daemon/DaemonRunner` 不放入 `daemon/index.ts`**：它是入口脚本（模块顶层执行 `main()` 并校验 `BRIER_DAEMON_MODE`），被 import 会触发副作用；由 `DaemonManager` 以文件路径 spawn
- `task-output` 走 `OutputBatcher` 批量发送，**终态消息（complete/error）必须先 `flushTask`** 再上报，否则残留输出会被服务端终态过滤丢弃
- `loadConfig()` 无参，只读环境变量；CLI 参数由 `DaemonManager` 写入子进程 env
- 令牌是用户级单值：生成新令牌会使旧 token 失效（前端仅显式“获取令牌”才生成，避免误开弹窗吊销连接）
- 发送失败不抛异常：`transport.send`/骨架 `send` 返回 `false`（未连接/背压），`safeSend` 按设计丢弃，断线窗口不上行

## 构建与发布

- `tsc` → `dist/`（JS，ESM）+ `types/`（声明）；`package.json` 暴露主入口与 `./tunnel` 子路径（`exports` 限制深路径 import）
- `--version` 运行时读 package.json：`config/version.ts` 相对 dist 定位（`../../package.json`）
- 发布：`release:patch|minor|major` = `npm version` + `npm publish`（`prepublishOnly` 先构建）

## 已知边界（供后续演进参考）

- 断线窗口的 task-output/终态不做缓冲，重连后无任务对账（任务可能滞留 running）
- 服务端输出为单行 `output ||= chunk` 追加（O(n²) 写放大），前端详情 1.5s 整包轮询——客户端批发送已落地，服务端/前端为下一阶段优化点
- 隧道 50 次退避耗尽后停止且无自动重启（状态保持 `error`，需 `daemon restart`）
- daemon 进程本身无崩溃监督（异常会退出，不自动拉起）
- 路径与探测基于 `homedir()`，隐含单用户假设
- `TaskExecutor` 输出逐 `data` 块 `toString()`，跨块多字节 UTF-8 字符可能截断（已知，未修）
