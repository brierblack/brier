import { spawn, type ChildProcess } from 'node:child_process';
import type { TaskInfo } from '../types.js';
import { logger } from '../logger.js';
import { resolveRuntimeExecutable, RUNTIME_PROMPT_FLAGS } from '../runtimes.js';

const MAX_CONCURRENT = 3;

export interface TaskExecutorCallbacks {
  onOutput: (taskId: string, stream: 'stdout' | 'stderr', data: string) => void;
  onComplete: (taskId: string, exitCode: number) => void;
  onError: (taskId: string, error: string) => void;
}

export interface TaskExecutor {
  execute: (task: TaskInfo) => void;
  cancel: (taskId: string) => void;
  cancelAll: () => void;
}

export const createTaskExecutor = (callbacks: TaskExecutorCallbacks): TaskExecutor => {
  const processes = new Map<string, ChildProcess>();

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
        stdio: ['pipe', 'pipe', 'pipe'],
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
      processes.delete(task.taskId);
      logger.error(`Task ${task.taskId} process error:`, err.message);
      callbacks.onError(task.taskId, err.message);
    });

    child.on('close', (code: number | null) => {
      processes.delete(task.taskId);
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
    child.kill('SIGTERM');
    processes.delete(taskId);
    logger.info(`Task ${taskId} cancelled`);
  };

  const cancelAll = () => {
    for (const [taskId, child] of processes) {
      child.kill('SIGTERM');
      logger.info(`Task ${taskId} cancelled (shutdown)`);
    }
    processes.clear();
  };

  return { execute, cancel, cancelAll };
};
