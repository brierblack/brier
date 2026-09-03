/**
 * 配置域统一出口：提供 daemon 装配所需的全部环境信息。
 *
 * 目录内文件职责：
 * - load.ts：  loadConfig()，从环境变量装配 DaemonConfig
 * - paths.ts： 应用路径常量（~/.brier 下的 PID/日志文件）
 * - version.ts：CLI 版本读取（package.json）
 */

/** daemon 装配配置（BRIER_SERVER_URL / BRIER_TOKEN → DaemonConfig） */
export { loadConfig } from './load.js';
/** 应用路径常量：BRIER_DIR / PID_FILE / LOG_FILE */
export { BRIER_DIR, PID_FILE, LOG_FILE } from './paths.js';
/** CLI 版本读取 */
export { readCliVersion } from './version.js';
