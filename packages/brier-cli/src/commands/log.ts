import { existsSync, readFileSync } from 'node:fs';
import { LOG_FILE } from '../config/index.js';

/** 默认打印的最近日志行数 */
const TAIL_LINES = 100;

/**
 * `brier daemon log`：查看后台服务日志。
 * 输出 ~/.brier/daemon.log 最近 100 行；文件不存在时给出提示与路径。
 */
export const logCommand = (): void => {
  if (!existsSync(LOG_FILE)) {
    console.log('尚未生成日志，daemon 可能从未启动过');
    console.log(`  日志路径: ${LOG_FILE}`);
    return;
  }

  const content = readFileSync(LOG_FILE, 'utf-8');
  const allLines = content.split('\n');
  // 去掉文件末尾换行产生的空行
  if (allLines.length > 0 && allLines[allLines.length - 1] === '') {
    allLines.pop();
  }

  const tail = allLines.slice(-TAIL_LINES);
  if (tail.length === 0) {
    console.log(`日志为空（${LOG_FILE}）`);
    return;
  }

  console.log(`最近 ${tail.length} 行日志（${LOG_FILE}）：`);
  console.log(tail.join('\n'));
};
