/**
 * daemon 的装配配置、生命周期状态与进程间通信文件。
 * 本文件三个类型均为“daemon 进程自身/前台 CLI 管理 daemon”使用，不参与隧道线协议。
 */

/**
 * daemon 后台服务运行状态（前台 CLI 使用，如 `brier daemon status`）。
 *
 * 当前 DaemonManager.status() 实际只产出 running | stopped（进程不在即清理 PID 文件并返回 stopped）；
 * error 为预留值，尚无产出点。
 */
export type DaemonStatus = 'running' | 'stopped' | 'error';

/**
 * daemon 装配配置。
 *
 * 由 config.loadConfig() 从 CLI 参数与 BRIER_SERVER_URL / BRIER_TOKEN 环境变量加载，
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
 * ~/.brier/daemon.pid 文件内容。
 *
 * 前台 CLI 与 detached daemon 子进程之间没有 IPC 通道，二者通过该文件 + 信号协作：
 * DaemonManager.start 写入、stop/status 读取，进程退出后清理。
 */
export interface PidFileData {
  /** daemon 子进程 PID */
  pid: number;
  /** 启动时间戳（ms），status 命令用于展示启动时间 */
  startTime: number;
  /** 启动时连接的服务端地址，restart 未传 --server-url 时回退使用 */
  serverUrl: string;
}
