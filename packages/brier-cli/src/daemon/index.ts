/**
 * daemon 域统一出口。
 *
 * 说明：DaemonRunner.ts 是 daemon 子进程的入口脚本（模块顶层即执行 main()，
 * 并校验 BRIER_DAEMON_MODE），由 DaemonManager 以文件路径 spawn，
 * 不应被 import，故不在此导出。本目录其余模块均无副作用，可安全经此导入。
 */

/** daemon 进程生命周期管理（前台 CLI 使用） */
export { createDaemonManager, type DaemonManager } from './DaemonManager.js';
/** 任务执行器（daemon 子进程内 spawn runtime） */
export {
  createTaskExecutor,
  type TaskExecutor,
  type TaskExecutorCallbacks,
} from './TaskExecutor.js';
/** daemon 运行状态读取（status/restart 展示与回退） */
export { readDaemonState } from './state.js';
