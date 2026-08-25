import { spawn, type ChildProcess } from 'node:child_process';
import type { TaskInfo } from '../types.js';
import { logger } from '../logger.js';
import { RUNTIME_COMMANDS } from '../runtimes.js';

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

  const resolveCommand = (task: TaskInfo): string => {
    if (task.command) return task.command;
    const mapped = RUNTIME_COMMANDS[task.runtime];
    if (mapped) return mapped;
    throw new Error(`Cannot resolve command for runtime: ${task.runtime}`);
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
    const childEnv = task.env ? { ...process.env, ...task.env } : process.env;

    logger.info(`Task ${task.taskId} starting: ${cmd} ${task.args.join(' ')}`, task.runtime);

    let child: ChildProcess;
    try {
      child = spawn(cmd, task.args, {
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
