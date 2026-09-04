import { spawn, type ChildProcess } from 'node:child_process';
import { chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import pty from 'node-pty';
import type { TaskInfo } from '../definitions/index.js';
import {
  logger,
  resolveRuntimeExecutable,
  RUNTIME_PROMPT_FLAGS,
  RUNTIME_RESUME_FLAGS,
} from '../core/index.js';

const require = createRequire(import.meta.url);

/**
 * 修复 node-pty 的 darwin spawn-helper 可执行权限。
 *
 * 现象：node-pty 在 macOS 上先 spawn 自带的 spawn-helper 再执行目标命令；
 * 若该 helper 因下载/安装而缺失可执行位（0644），posix_spawnp 返回 EACCES，
 * 且 node-pty 只抛出笼统的 "posix_spawnp failed."（无 errno），难以定位。
 * 每次 pty 启动前兜底 chmod +x，兼容重装后权限再丢失的情况。
 */
const ensurePtyHelperExecutable = (): void => {
  if (process.platform !== 'darwin') return;
  try {
    const pkgDir = dirname(require.resolve('node-pty/package.json'));
    const helper = join(pkgDir, 'prebuilds', `darwin-${process.arch}`, 'spawn-helper');
    chmodSync(helper, 0o755);
  } catch {
    // helper 权限修正失败不致命：若 node-pty 自身可执行则正常走；否则抛错由上层捕获
  }
};

const MAX_CONCURRENT = 3;
/** 取消后等待 SIGTERM 生效的时间，超时升级 SIGKILL（仅 pipe 模式需要；pty.kill 为同步终止） */
const KILL_GRACE_MS = 2_000;
/** dispose 整体等待上限 */
const DISPOSE_TIMEOUT_MS = 2_000;
const DISPOSE_POLL_MS = 100;
/** 交互 CLI 启动后到可接收输入的就绪等待（全屏 TUI 初始化较慢，如 opencode） */
const PTY_STARTUP_DELAY_MS = 1_200;

/** node-pty 伪终端句柄类型（避免直接依赖其类型导出形态） */
type PtyHandle = ReturnType<typeof pty.spawn>;

export interface TaskExecutorCallbacks {
  onOutput: (taskId: string, stream: 'stdout' | 'stderr', data: string) => void;
  onComplete: (taskId: string, exitCode: number) => void;
  onError: (taskId: string, error: string) => void;
}

export interface TaskExecutor {
  execute: (task: TaskInfo) => void;
  /** 向运行中任务写入输入（pty = 模拟击键；pipe = 写 stdin）。任务不存在/不可写返回 false */
  writeInput: (taskId: string, data: string) => boolean;
  /** 取消单个任务：pipe 走 SIGTERM（宽限期后 SIGKILL）；pty 直接终止伪终端会话 */
  cancel: (taskId: string) => void;
  /** 停止并收尾：对全部运行中任务终止，等待退出；pipe 超时升级 SIGKILL */
  dispose: () => Promise<void>;
}

export const createTaskExecutor = (callbacks: TaskExecutorCallbacks): TaskExecutor => {
  /** pipe 模式子进程（ChildProcess，原有实现） */
  const pipeProcs = new Map<string, ChildProcess>();
  /** pty 模式伪终端会话 */
  const ptyProcs = new Map<string, PtyHandle>();
  /** 已请求取消的任务：其 close/onExit 不再上报 complete */
  const cancelRequested = new Set<string>();
  /** 已上报终态（error/complete 二选一，防双重上报） */
  const finished = new Set<string>();
  /** 取消后的 SIGKILL 升级计时器（仅 pipe 模式使用） */
  const killTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const runningCount = () => pipeProcs.size + ptyProcs.size;

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
        if (pipeProcs.get(taskId) === child) {
          logger.warn(`Task ${taskId} did not exit after SIGTERM, sending SIGKILL`);
          child.kill('SIGKILL');
        }
      }, delayMs),
    );
  };

  /** 终态去重 + 统一清理（出表/清定时器）。注意：不清 cancelRequested，由调用分支决定取消语义 */
  const markFinished = (taskId: string): boolean => {
    if (finished.has(taskId)) return false;
    finished.add(taskId);
    clearKillTimer(taskId);
    pipeProcs.delete(taskId);
    ptyProcs.delete(taskId);
    return true;
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
   * - prompt 模式（AI runtime）：命令前缀 flags + 续接参数(可选) + prompt 原文
   * - 命令模式：透传服务端给的 args
   */
  const buildArgs = (task: TaskInfo): string[] => {
    if (task.prompt) {
      const args = [...(RUNTIME_PROMPT_FLAGS[task.runtime] ?? [])];
      if (task.resumeSessionId) {
        const flag = RUNTIME_RESUME_FLAGS[task.runtime];
        if (flag) args.push(...flag, task.resumeSessionId);
      }
      args.push(task.prompt);
      return args;
    }
    return task.args ?? [];
  };

  const buildEnv = (task: TaskInfo): NodeJS.ProcessEnv =>
    task.env ? { ...process.env, ...task.env } : process.env;

  /** pipe 模式：非交互子进程，stdout/stderr 管道直传（原有行为，保持逐字节 toString 语义） */
  const executePipe = (
    task: TaskInfo,
    cmd: string,
    args: string[],
    childEnv: NodeJS.ProcessEnv,
  ) => {
    let child: ChildProcess;
    try {
      child = spawn(cmd, args, {
        cwd: task.cwd,
        env: childEnv,
        // stdin 置 ignore：非交互任务输入全部来自 prompt/command 参数，runtime 无交互输入。
        // 若用 pipe 且不关闭，TUI 类 runtime（opencode 等）会因 stdin 永不 EOF 而挂起不执行。
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      callbacks.onError(task.taskId, err instanceof Error ? err.message : String(err));
      return;
    }

    pipeProcs.set(task.taskId, child);

    child.stdout?.on('data', (data: Buffer) => {
      callbacks.onOutput(task.taskId, 'stdout', data.toString());
    });

    child.stderr?.on('data', (data: Buffer) => {
      callbacks.onOutput(task.taskId, 'stderr', data.toString());
    });

    child.on('error', (err: Error) => {
      // error 后可能仍触发 close：终态只上报一次
      if (!markFinished(task.taskId)) return;
      cancelRequested.delete(task.taskId);
      logger.error(`Task ${task.taskId} process error:`, err.message);
      callbacks.onError(task.taskId, err.message);
    });

    child.on('close', (code: number | null) => {
      if (!markFinished(task.taskId)) return;
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

  /**
   * pty 模式：伪终端交互子进程。
   * CLI 检测到 tty 后进入交互模式（会提问、渲染进度、等待输入）；
   * 屏幕字节经 onData 上行（含 ANSI），用户输入经 writeInput 写入（模拟击键）。
   *
   * 与 pipe 模式的关键差异：prompt 任务不再把 prompt 拼成命令行参数，
   * 而是启动后作为“用户输入”敲进终端（交互式 CLI 从会话里读取首条消息）。
   */
  const executePty = (
    task: TaskInfo,
    cmd: string,
    args: string[],
    childEnv: NodeJS.ProcessEnv,
    initialInput?: string,
  ) => {
    let handle: PtyHandle;
    try {
      ensurePtyHelperExecutable();
      handle = pty.spawn(cmd, args, {
        name: 'xterm-256color',
        cols: 120,
        rows: 32,
        cwd: task.cwd,
        env: childEnv,
      });
    } catch (err) {
      callbacks.onError(task.taskId, err instanceof Error ? err.message : String(err));
      return;
    }

    ptyProcs.set(task.taskId, handle);
    logger.info(`Task ${task.taskId} started in pty mode: ${cmd} ${args.join(' ')}`, task.runtime);

    // prompt 作为首条会话消息敲入（补回车触发提交）；无 prompt（command 模式）不注入。
    // 时序：交互 CLI（尤其全屏 TUI，如 opencode）需要时间完成初始化，过早写入会被丢弃，
    // 导致会话一直停在“等待输入”态；延迟到终端就绪后再注入。
    if (initialInput) {
      const pendingWrite = setTimeout(() => {
        try {
          if (ptyProcs.get(task.taskId) === handle) {
            handle.write(initialInput);
          }
        } catch {
          // 会话已结束等情况：忽略注入失败
        }
      }, PTY_STARTUP_DELAY_MS);
      // 会话先于注入结束时取消定时器，避免向已死终端写入
      const clearOnExit = () => {
        clearTimeout(pendingWrite);
      };
      handle.onExit(clearOnExit);
    }

    handle.onData((data: string) => {
      // pty 只有一路输出（合并 stdout/stderr 的终端字节流），统一按 stdout 上行；
      // 前端如需区分文本/控制序列，属于展示层解析，不在执行层拆流。
      callbacks.onOutput(task.taskId, 'stdout', data);
    });

    handle.onExit(({ exitCode }) => {
      if (!markFinished(task.taskId)) return;
      if (cancelRequested.has(task.taskId)) {
        cancelRequested.delete(task.taskId);
        logger.info(`Task ${task.taskId} cancelled`);
        return;
      }
      const code = exitCode ?? 0;
      logger.info(`Task ${task.taskId} completed with exit code ${code}`);
      callbacks.onComplete(task.taskId, code);
    });
  };

  const execute = (task: TaskInfo) => {
    if (pipeProcs.has(task.taskId) || ptyProcs.has(task.taskId)) {
      logger.warn(`Task ${task.taskId} is already running, cancelling previous instance`);
      cancel(task.taskId);
    }

    if (runningCount() >= MAX_CONCURRENT) {
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

    const childEnv = buildEnv(task);

    if (task.execMode === 'pty') {
      // 交互模式：prompt 不拼参数，作为首条输入敲入；command 模式透传 args
      const args = task.prompt ? [] : (task.args ?? []);
      const initialInput =
        task.prompt !== undefined && task.prompt.trim() !== ''
          ? `${task.prompt.replace(/\r?\n/g, '\r')}\r`
          : undefined;
      executePty(task, cmd, args, childEnv, initialInput);
      return;
    }
    executePipe(task, cmd, buildArgs(task), childEnv);
  };

  const writeInput = (taskId: string, data: string): boolean => {
    if (!data) return false;
    const handle = ptyProcs.get(taskId);
    if (handle) {
      try {
        handle.write(data);
        return true;
      } catch (err) {
        logger.error(`Task ${taskId} pty write failed:`, err);
        return false;
      }
    }
    const child = pipeProcs.get(taskId);
    if (child?.stdin?.writable) {
      child.stdin.write(data);
      return true;
    }
    return false;
  };

  const cancel = (taskId: string) => {
    if (cancelRequested.has(taskId)) return;
    cancelRequested.add(taskId);

    const handle = ptyProcs.get(taskId);
    if (handle) {
      logger.info(`Task ${taskId} cancelling (pty kill)`);
      try {
        handle.kill();
      } catch (err) {
        logger.warn(`Task ${taskId} pty kill failed, escalating SIGKILL:`, err);
        try {
          handle.kill('SIGKILL');
        } catch {
          // 兜底：升级失败也收口，避免悬挂
          if (markFinished(taskId)) {
            callbacks.onError(taskId, 'cancel failed');
          }
        }
      }
      return;
    }

    const child = pipeProcs.get(taskId);
    if (!child) return;
    logger.info(`Task ${taskId} cancelling (SIGTERM)`);
    child.kill('SIGTERM');
    armKillTimer(taskId, child, KILL_GRACE_MS);
  };

  const dispose = (): Promise<void> => {
    if (runningCount() === 0) return Promise.resolve();

    for (const taskId of [...ptyProcs.keys()]) {
      cancelRequested.add(taskId);
      logger.info(`Task ${taskId} cancelling (shutdown, pty kill)`);
      try {
        ptyProcs.get(taskId)?.kill();
      } catch {
        markFinished(taskId);
      }
    }
    for (const [taskId, child] of pipeProcs) {
      cancelRequested.add(taskId);
      logger.info(`Task ${taskId} cancelling (shutdown, SIGTERM)`);
      child.kill('SIGTERM');
      armKillTimer(taskId, child, KILL_GRACE_MS);
    }

    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (runningCount() === 0 || Date.now() - start >= DISPOSE_TIMEOUT_MS) {
          // 仍未退出的 pipe 子进程升级为 SIGKILL；pty 已同步 kill
          for (const [taskId, child] of pipeProcs) {
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

  return { execute, writeInput, cancel, dispose };
};
