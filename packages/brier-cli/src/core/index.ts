/**
 * 公共底座统一出口：无业务依赖的基础能力，供 config/daemon/tunnel/commands 各域使用。
 *
 * 目录内文件职责：
 * - logger.ts： 文件日志（configureLogger / logger）
 * - runtimes.ts：AI runtime 注册表、可执行文件解析与已安装探测
 */

/** 文件日志 */
export { configureLogger, logger } from './logger.js';
/** AI runtime 注册表 / 命令 / prompt 参数 / 解析 / 探测 */
export * from './runtimes.js';
