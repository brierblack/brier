/**
 * 隧道域类型（daemon ⇄ Brier 服务端 的连接与消息）。
 *
 * 聚合三组归属不同的类型：
 * 1. StreamType / ClientMessage / ServerMessage：线协议（WebSocket JSON 文本帧），
 *    与服务端 Rust `brier_type::tunnel::*` 镜像，任何命名/字段改动两端必须同步；
 * 2. TunnelState：daemon 进程内的连接状态机（服务端无对应，不上报）。
 */

/**
 * 任务输出流的来源。
 *
 * 由 daemon 的 TaskExecutor 转发子进程输出时标记（stdout / stderr），
 * 随上行消息 task-output 一并上报给服务端。
 *
 * 注意：序列化值需与服务端 Rust 侧 `brier_type::tunnel::StreamType` 保持一致（lowercase），
 * 新增流类型时两端必须同步修改。
 */
export type StreamType = 'stdout' | 'stderr';

/**
 * 子进程执行形态（随 task-start 下发，两端同步）：
 * - pipe：非交互，stdout/stderr 管道直传（默认，向后兼容旧行为）
 * - pty：伪终端交互，可接收 task-input 写入（AI 提问等场景）
 */
export type ExecMode = 'pipe' | 'pty';

/**
 * 隧道线协议消息（daemon ⇄ Brier 服务端，WebSocket JSON 文本帧）。
 *
 * 使用可辨识联合：以 `type` 字段区分消息，type 值为 kebab-case（如 task-output / auth-ok），
 * 字段名为 camelCase。与服务端 Rust `brier_type::tunnel::{ClientMessage, ServerMessage}`
 * 经 serde（tag="type", rename_all="kebab-case" + 字段 rename）逐字段对齐，
 * 任何一端新增/删除字段或改动命名时，另一端必须同步修改，否则 JSON 解析会失败或丢字段。
 */

/**
 * 上行消息（daemon → 服务端）。
 *
 * - auth：连接建立后的第一条鉴权消息；token 同时通过 wss Authorization 头携带（双通道，服务端以 header 为准）
 * - heartbeat：应用层心跳，触发服务端落库 last_seen_at 并回执 heartbeat-ack
 * - task-output：任务实时输出；当前实现为 stdout/stderr 每收到一个数据块即发一条
 * - task-complete：子进程正常退出（exitCode 为进程退出码）
 * - task-error：执行失败（如找不到可执行文件、超过并发上限）
 * - runtime-info：runtime 清单上报（服务端目前仅记录日志，属预留能力）
 */
export type ClientMessage =
  | {
      type: 'auth';
      token: string;
      hostname: string;
      os: string;
      runtimes: string[];
      /** CLI 自身版本（package.json），旧版客户端可能不带该字段 */
      version?: string;
    }
  | { type: 'heartbeat'; timestamp: number }
  | { type: 'task-output'; taskId: string; stream: StreamType; data: string }
  | { type: 'task-complete'; taskId: string; exitCode: number }
  | { type: 'task-error'; taskId: string; error: string }
  | { type: 'runtime-info'; runtimes: string[] };

/**
 * 下行消息（服务端 → daemon）。
 *
 * - auth-ok：鉴权通过并完成注册，computerId 为本机在服务端的工作电脑 ID
 * - auth-failed：鉴权失败（令牌无效等），reason 为失败原因
 * - heartbeat-ack：心跳回执（echo 客户端发送的 timestamp）
 * - task-start：下发任务执行；prompt 模式由 CLI 按 runtime 拼参数，command 模式直接执行
 * - task-cancel：请求终止正在执行的子进程（SIGTERM）
 * - task-input：向运行中任务写入输入（pty 模式 = 模拟键盘击键；pipe 模式写入 stdin）
 * - query-runtimes：查询本机 runtime 清单（当前服务端不会主动发送，属预留；CLI 保留处理以兼容旧服务端）
 */
export type ServerMessage =
  | { type: 'auth-ok'; computerId: string }
  | { type: 'auth-failed'; reason: string }
  | { type: 'heartbeat-ack'; timestamp: number }
  | {
      type: 'task-start';
      taskId: string;
      /** 所属 AI runtime 名称（如 Claude Code / OpenCode）；command 模式为空串 */
      runtime: string;
      /** 可执行命令：command 模式为显式命令；runtime 模式为空，由 CLI 探测解析 */
      command: string;
      args: string[];
      /** 子进程工作目录（可选） */
      cwd?: string;
      /** 注入子进程的额外环境变量（可选） */
      env?: Record<string, string>;
      /** 自然语言指令（可选）：存在时按 RUNTIME_PROMPT_FLAGS 拼入执行参数 */
      prompt?: string;
      /** 执行形态（可选）：缺省 pipe（向后兼容旧服务端） */
      execMode?: ExecMode;
    }
  | { type: 'task-cancel'; taskId: string }
  | { type: 'task-input'; taskId: string; data: string }
  | { type: 'query-runtimes' };

/**
 * 隧道连接状态机。
 *
 * 仅存在于 daemon 进程内（TunnelClient 内部维护、DaemonRunner 订阅打印），不上报服务端：
 * connecting（握手）→ connected（收到 auth-ok）→ 断线进入 reconnecting；
 * 收到 auth-failed 或重连次数耗尽（50 次退避上限）时进入 error 并停止，
 * 主动 stop 时进入 disconnected。
 */
export type TunnelState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
