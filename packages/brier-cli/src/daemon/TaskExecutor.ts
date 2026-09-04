import { spawn, type ChildProcess } from 'node:child_process';
import type { TaskInfo } from '../definitions/index.js';
import { logger, resolveRuntimeExecutable, RUNTIME_PROMPT_FLAGS } from '../core/index.js';

const MAX_CONCURRENT = 3;
/** 取消后等待 SIGTERM 生效的时间，超时升级 SIGKILL */
const KILL_GRACE_MS = 2_000;
/** dispose 整体等待上限 */
const DISPOSE_TIMEOUT_MS = 2_000;
const DISPOSE_POLL_MS = 100;

export interface TaskExecutorCallbacks {
  onOutput: (taskId: string, stream: 'stdout' | 'stderr', data: string) => void;
  onComplete: (taskId: string, exitCode: number) => void;
  onError: (taskId: string, error: string) => void;
}

export interface TaskExecutor {
  execute: (task: TaskInfo) => void;
  /** 取消单个任务：SIGTERM，宽限期后 SIGKILL */
  cancel: (taskId: string) => void;
  /** 停止并收尾：对全部运行中任务 SIGTERM，等待退出，未退出的 SIGKILL */
  dispose: () => Promise<void>;
}

export const createTaskExecutor = (callbacks: TaskExecutorCallbacks): TaskExecutor => {
  const processes = new Map<string, ChildProcess>();
  /** 已请求取消的任务：其 close 不再上报 complete */
  const cancelRequested = new Set<string>();
  /** 已上报终态（error/complete 二选一，防双重上报）的任务 */
  const finished = new Set<string>();
  /** 取消后的 SIGKILL 升级计时器 */
  const killTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const clearKillTimer = (taskId: string) => {
    const timer = killTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      killTimers.delete(taskId);
    }
  };

  const armKillTimer = (taskId: string, child: ChildProcess, delayMs: number) => {
    clearKillTimer(taskId);
    killTimers.set(
      taskId,
      setTimeout(() => {
        killTimers.delete(taskId);
        if (processes.get(taskId) === child) {
          logger.warn(`Task ${taskId} did not exit after SIGTERM, sending SIGKILL`);
          child.kill('SIGKILL');
        }
      }, delayMs),
    );
  };

  /**
   * 解析要执行的命令：
   * - 显式 command：直接用（调用方负责其可执行性）
   * - runtime 模式：解析为**绝对路径**（PATH 或官方安装目录），
   *   避免 daemon 进程 PATH 不含 runtime 目录时 spawn ENOENT
   */
  const resolveCommand = (task: TaskInfo): string | null => {
    if (task.command) return task.command;
    return resolveRuntimeExecutable(task.runtime);
  };

  /**
   * 拼执行参数：
   * - prompt 模式（AI runtime）：命令前缀 flags + prompt 原文
   * - 命令模式：透传服务端给的 args
   */
  const buildArgs = (task: TaskInfo): string[] => {
    if (task.prompt) {
      const flags = RUNTIME_PROMPT_FLAGS[task.runtime] ?? [];
      return [...flags, task.prompt];
    }
    return task.args ?? [];
  };

  const execute = (task: TaskInfo) => {
    if (processes.has(task.taskId)) {
      logger.warn(`Task ${task.taskId} is already running, cancelling previous instance`);
      cancel(task.taskId);
    }

    if (processes.size >= MAX_CONCURRENT) {
      callbacks.onError(task.taskId, `Max concurrent tasks (${MAX_CONCURRENT}) reached`);
      return;
    }

    const cmd = resolveCommand(task);
    if (!cmd) {
      callbacks.onError(
        task.taskId,
        `Cannot resolve command for runtime: ${task.runtime} (no command provided)`,
      );
      return;
    }

    const args = buildArgs(task);
    const childEnv = task.env ? { ...process.env, ...task.env } : process.env;

    logger.info(`Task ${task.taskId} starting: ${cmd} ${args.join(' ')}`, task.runtime);

    let child: ChildProcess;
    try {
      child = spawn(cmd, args, {
        cwd: task.cwd,
        env: childEnv,
        // stdin 置 ignore：任务输入全部来自 prompt/command 参数，runtime 无交互输入。
        // 若用 pipe 且不关闭，TUI 类 runtime（opencode 等）会因 stdin 永不 EOF 而挂起不执行。
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      callbacks.onError(task.taskId, err instanceof Error ? err.message : String(err));
      return;
    }

    processes.set(task.taskId, child);

    child.stdout?.on('data', (data: Buffer) => {
      callbacks.onOutput(task.taskId, 'stdout', data.toString());
    });

    child.stderr?.on('data', (data: Buffer) => {
      callbacks.onOutput(task.taskId, 'stderr', data.toString());
    });

    child.on('error', (err: Error) => {
      // error 后可能仍触发 close：终态只上报一次
      if (finished.has(task.taskId)) return;
      finished.add(task.taskId);
      clearKillTimer(task.taskId);
      processes.delete(task.taskId);
      logger.error(`Task ${task.taskId} process error:`, err.message);
      callbacks.onError(task.taskId, err.message);
    });

    child.on('close', (code: number | null) => {
      if (finished.has(task.taskId)) return;
      finished.add(task.taskId);
      clearKillTimer(task.taskId);
      processes.delete(task.taskId);

      if (cancelRequested.has(task.taskId)) {
        cancelRequested.delete(task.taskId);
        logger.info(`Task ${task.taskId} cancelled`);
        return;
      }

      const exitCode = code ?? 0;
      logger.info(`Task ${task.taskId} completed with exit code ${exitCode}`);
      callbacks.onComplete(task.taskId, exitCode);
    });
  };

  const cancel = (taskId: string) => {
    const child = processes.get(taskId);
    if (!child) {
      logger.warn(`Task ${taskId} not found, cannot cancel`);
      return;
    }
    if (cancelRequested.has(taskId)) {
      return;
    }
    cancelRequested.add(taskId);
    logger.info(`Task ${taskId} cancelling (SIGTERM)`);
    child.kill('SIGTERM');
    armKillTimer(taskId, child, KILL_GRACE_MS);
  };

  const dispose = (): Promise<void> => {
    if (processes.size === 0) return Promise.resolve();

    for (const [taskId, child] of processes) {
      cancelRequested.add(taskId);
      logger.info(`Task ${taskId} cancelling (shutdown, SIGTERM)`);
      child.kill('SIGTERM');
      armKillTimer(taskId, child, KILL_GRACE_MS);
    }

    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (processes.size === 0 || Date.now() - start >= DISPOSE_TIMEOUT_MS) {
          // 仍未退出的升级为 SIGKILL；close 事件随后清理各集合
          for (const [taskId, child] of processes) {
            logger.warn(`Task ${taskId} force killed during shutdown`);
            child.kill('SIGKILL');
          }
          resolve();
          return;
        }
        setTimeout(check, DISPOSE_POLL_MS);
      };
      check();
    });
  };

  return { execute, cancel, dispose };
};
