import type { ClientMessage, DaemonConfig, TunnelState } from '../definitions/index.js';
import { loadConfig, LOG_FILE } from '../config/index.js';
import { configureLogger, logger } from '../core/index.js';
import {
  createTunnelClient,
  type TunnelClient,
  type TunnelMessageHandlers,
} from '../tunnel/index.js';
import { createTaskExecutor, type TaskExecutor } from './TaskExecutor.js';
import { createOutputBatcher, type OutputBatcher } from './OutputBatcher.js';
import { updateDaemonState } from './state.js';

/**
 * daemon 运行时句柄：把隧道/任务执行器/批处理器与生命周期出口显式收拢，
 * 组合根只返回这一个对象，杜绝模块级隐式可变状态。
 */
interface DaemonContext {
  tunnel: TunnelClient;
  taskExecutor: TaskExecutor;
  outputBatcher: OutputBatcher;
  /** 优雅停止：flush 残留输出 → 关闭隧道 → 收尾任务 → 清理批处理器 */
  stop: () => Promise<void>;
}

/**
 * 组合根：装配并启动 daemon 的全部运行时组件。
 * 纯装配职责，不注册信号、不触碰 process；进程级接线由 main 完成。
 */
const startDaemon = (config: DaemonConfig): DaemonContext => {
  // 先声明后赋值：safeSend 闭包在隧道启动后才被事件触发，此处为延迟引用
  let tunnel: TunnelClient | null = null;

  // send() 不抛异常（未连接/背压返回 false）；未发出的帧按设计丢弃（断线窗口不上行，属已知边界）
  const safeSend = (message: ClientMessage) => {
    tunnel?.send(message);
  };

  // task-output 走批量发送（高频小消息合并，见 OutputBatcher）；终态/控制消息仍即时上报
  const outputBatcher = createOutputBatcher({
    onFlush: (chunks) => {
      for (const chunk of chunks) {
        safeSend({
          type: 'task-output',
          taskId: chunk.taskId,
          stream: chunk.stream,
          data: chunk.data,
        });
      }
    },
  });

  const taskExecutor = createTaskExecutor({
    onOutput: (taskId, stream, data) => outputBatcher.push(taskId, stream, data),
    onComplete: (taskId, exitCode) => {
      outputBatcher.flushTask(taskId); // 终态前先发出该任务残留输出，避免被服务端终态过滤丢弃
      safeSend({ type: 'task-complete', taskId, exitCode });
    },
    onError: (taskId, error) => {
      outputBatcher.flushTask(taskId);
      safeSend({ type: 'task-error', taskId, error });
    },
  });

  // 组合点：把隧道下发的业务消息翻译成任务执行动作
  const messageHandlers: TunnelMessageHandlers = {
    onTaskStart: (message) => {
      taskExecutor.execute({
        taskId: message.taskId,
        runtime: message.runtime,
        command: message.command,
        args: message.args,
        cwd: message.cwd,
        env: message.env,
        prompt: message.prompt,
        execMode: message.execMode,
        resumeSessionId: message.resumeSessionId,
      });
    },
    onTaskCancel: (taskId) => {
      taskExecutor.cancel(taskId);
    },
    onTaskInput: (message) => {
      // 回答 AI 提问 / 交互输入：写入执行器；任务不存在/不可写时记录即可（无应答通道，靠输出侧感知）
      const ok = taskExecutor.writeInput(message.taskId, message.data);
      if (!ok) {
        logger.warn(`Task ${message.taskId} input ignored: task not running or not writable`);
      }
    },
  };

  const client = createTunnelClient(config, messageHandlers);
  tunnel = client;

  client.onStateChange((state: TunnelState) => {
    logger.info('Tunnel state:', state);
    // 状态落盘（低频状态切换），供 `daemon status` 展示
    updateDaemonState({ tunnelState: state });
  });

  client.start();
  updateDaemonState({ ready: true }); // 就绪握手：告知前台 Manager 启动成功
  logger.info('Daemon runner started');
  logger.info('Server:', config.serverUrl);
  logger.info('Hostname:', config.hostname);
  logger.info('OS:', config.os);
  logger.info('Runtimes:', config.runtimes.join(', ') || 'none detected');

  const stop = async () => {
    outputBatcher.flushAll(); // 连接关闭前先把残留的任务输出发出去
    await client.stop();
    await taskExecutor.dispose();
    outputBatcher.dispose();
  };

  return { tunnel: client, taskExecutor, outputBatcher, stop };
};

const shutdown = async (ctx: DaemonContext, signal: string) => {
  logger.info(`Received ${signal}, shutting down...`);
  try {
    await ctx.stop();
  } finally {
    process.exit(0);
  }
};

const main = () => {
  if (process.env.BRIER_DAEMON_MODE !== '1') {
    console.error(
      'This script is intended to be run as a daemon. Use "brier daemon start" instead.',
    );
    process.exit(1);
  }

  configureLogger(LOG_FILE);

  let config: DaemonConfig;
  try {
    config = loadConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    updateDaemonState({ bootError: message }); // 启动失败原因回写，Manager 据此中止
    logger.error('Config error:', message);
    process.exit(1);
  }

  // 进程级接线：句柄只存于 main 作用域，注册信号/异常处理都显式接收它
  let ctx: DaemonContext | null = null;

  const handleSignal = (signal: string) => () => {
    if (ctx) {
      void shutdown(ctx, signal);
    }
  };

  const handleUncaughtError = (err: Error) => {
    logger.error('Uncaught error:', err.stack ?? err.message);
    const cleanup = ctx ? ctx.stop() : Promise.resolve();
    void cleanup.finally(() => process.exit(1));
  };

  process.on('SIGTERM', handleSignal('SIGTERM'));
  process.on('SIGINT', handleSignal('SIGINT'));
  process.on('uncaughtException', handleUncaughtError);
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
    const cleanup = ctx ? ctx.stop() : Promise.resolve();
    void cleanup.finally(() => process.exit(1));
  });

  ctx = startDaemon(config);
};

main();
