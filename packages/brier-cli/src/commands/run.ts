/**
 * 命令执行包装：统一 try/catch 与失败退出码。
 * commander 的 action 直接返回 runCommand(...)，消除各命令重复的错误处理样板。
 */
export const runCommand = async (fn: () => void | Promise<void>): Promise<void> => {
  try {
    await fn();
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
};
