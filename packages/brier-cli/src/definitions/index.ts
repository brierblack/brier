/**
 * 类型契约统一出口。
 *
 * 目录按功能域拆分：
 * - tunnel.ts：隧道域（线协议 StreamType / ClientMessage / ServerMessage + 连接状态机 TunnelState）
 * - task.ts：  本地任务执行上下文（消息 → 子进程执行）
 * - daemon.ts：daemon 装配配置 / 生命周期状态 / PID 文件
 *
 * 约定：业务模块一律从本文件（'../definitions/index.js'）导入，不要跨层直接引用子文件，
 * 以便后续调整目录结构时只需改这里，不动各调用方。
 */

/** 隧道域：输出流来源、线协议上行/下行消息、连接状态机 */
export type { StreamType, ClientMessage, ServerMessage, TunnelState } from './tunnel.js';

/** 本地任务执行上下文（TaskExecutor 入参） */
export type { TaskInfo } from './task.js';

/** daemon 生命周期相关：DaemonStatus / DaemonConfig / PidFileData */
export type { DaemonStatus, DaemonConfig, PidFileData } from './daemon.js';
