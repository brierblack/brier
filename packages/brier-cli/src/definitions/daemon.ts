/**
 * daemon 的装配配置、生命周期状态与进程间通信文件。
 * 本文件三个类型均为“daemon 进程自身/前台 CLI 管理 daemon”使用，不参与隧道线协议。
 */

/**
 * daemon 后台服务运行状态（前台 CLI 使用，如 `brier daemon status`）。
 *
 * 当前实现实际只产出 running | stopped（进程不在即清理状态文件并返回 stopped）；
 * error 为预留值，尚无产出点。
 */
export type DaemonStatus = 'running' | 'stopped' | 'error';

/**
 * daemon 装配配置。
 *
 * 由 config.loadConfig() 从 BRIER_SERVER_URL / BRIER_TOKEN 环境变量加载，
 * DaemonRunner 启动后整体注入 TunnelClient；其中 hostname/os/runtimes/version
 * 在握手时随 auth 消息上报服务端用于展示与任务路由。
 */
export interface DaemonConfig {
  /** Brier 服务端地址（http/https，连接时由 toWsUrl 转换为 ws/wss 并拼接 /tunnel） */
  serverUrl: string;
  /** 接入令牌（BRIER_TOKEN），同时用于 wss Authorization 头与 auth 消息 */
  token: string;
  /** 本机主机名（同时作为服务端按用户维度 upsert 工作电脑的标识键） */
  hostname: string;
  /** 操作系统描述（`${type} ${platform} ${arch}`，仅供展示） */
  os: string;
  /** 探测到的已安装 AI runtime 列表（探测与执行共用 resolveRuntimeExecutable） */
  runtimes: string[];
  /** CLI 自身版本（读取 package.json），供服务端展示客户端版本 */
  version: string;
}

/**
 * daemon 运行状态文件内容（~/.brier/daemon.json）。
 *
 * 前台 CLI 与 daemon 子进程之间没有 IPC 通道，二者通过该文件 + 信号协作：
 * - 前台 DaemonManager：启动时写入（ready=false），轮询 ready 做就绪握手；
 * - daemon 子进程（Runner）：配置加载成功进入运行后置 ready=true，
 *   启动早期失败时写 bootError，隧道状态变化时更新 tunnelState；
 * - 前台 status/restart：读取展示与回退（serverUrl）。
 *
 * 身份校验：以 pid + 进程命令行（含 DaemonRunner）双重匹配，
 * 避免 PID 被系统复用后误判/误杀其他进程。
 */
export interface DaemonState {
  /** daemon 子进程 PID */
  pid: number;
  /** 启动时间戳（ms） */
  startTime: number;
  /** 启动时连接的服务端地址，restart 未传 --server-url 时回退使用 */
  serverUrl: string;
  /** 子进程是否已完成启动（Runner 进入运行循环后置 true） */
  ready: boolean;
  /** 启动早期失败原因（仅失败时写入） */
  bootError?: string;
  /** 最近一次隧道状态（Runner 随状态机更新，供 status 展示） */
  tunnelState?: string;
}
