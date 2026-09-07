/**
 * Brier CLI 接入命令构造。
 * server-url 取当前站点 origin（后端同源托管前端与 /tunnel WS）。
 */
export interface CliCommands {
  install: string;
  start: string;
  stop: string;
  restart: string;
}

export const buildCliCommands = (token: string): CliCommands => ({
  install: 'npm install -g @brierb/brier-cli@latest',
  start: `BRIER_TOKEN='${token}' brier daemon start --server-url ${window.location.origin}`,
  stop: 'brier daemon stop',
  restart: 'brier daemon restart',
});

/** 交给本机 AI 的分步接入 Prompt（含真实令牌与站点地址）。 */
export const buildConnectPrompt = (
  token: string,
): string => `请帮我在本机接入 Brier 远程编码池，分两步完成：

【1. 安装 brier CLI】
- 先确认 Node.js 已装（无则用 nvm 安装 LTS）
- 执行：npm install -g @brierb/brier-cli@latest
- 如 brier 已安装，请升级到 latest

【2. 启动后台服务】
- 执行：BRIER_TOKEN='${token}' brier daemon start --server-url ${window.location.origin}
- BRIER_TOKEN 是临时密钥（约 30 天有效），请勿写入版本控制或分享
- 如后台服务已在跑，先告诉我状态，不要强行重启
- 执行过程中遇到需要权限或选择的步骤先问我；全部完成后告诉我"后台服务已上线"，我会回到平台页面等待自动发现。（跟我汇报时把 daemon 一律说"后台服务"。）`;
