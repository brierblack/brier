/**
 * 本地任务执行上下文。
 *
 * TunnelClient 收到下行 task-start 消息后，将其转换为本结构交给
 * TaskExecutor.execute() 执行——是“隧道传输形态”（ServerMessage）
 * 与“子进程执行形态”之间的进程内中间对象，不上报服务端。
 */
export interface TaskInfo {
  taskId: string;
  /** 所属 AI runtime 名称；command 模式为空串 */
  runtime: string;
  /**
   * 可执行命令：
   * - command 模式：服务端下发的显式 shell 命令
   * - runtime 模式：由 resolveRuntimeExecutable 解析为绝对路径（保证脱离受限 PATH 也能 spawn）
   */
  command: string;
  args: string[];
  /** 子进程工作目录（可选） */
  cwd?: string;
  /** 注入子进程的额外环境变量（可选） */
  env?: Record<string, string>;
  /** 自然语言指令（可选）：存在时按 RUNTIME_PROMPT_FLAGS 拼到命令参数中执行 */
  prompt?: string;
}
