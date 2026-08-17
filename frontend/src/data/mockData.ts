import type { Agent, Workspace, Team, Skill } from '../types';

export const agents: Agent[] = [
  { id: 1, name: '数据分析助手', model: 'GPT-4o', status: 'online', skills: 5, tools: 3, team: '数据洞察', desc: '数据查询、可视化与分析报告生成', workspace: '本地开发', icon: '📊', color: '#fe6e00', runs: 1284 },
  { id: 2, name: '代码审查员', model: 'Claude 3.5', status: 'online', skills: 8, tools: 6, team: '工程效能', desc: '自动化代码审查，识别潜在问题', workspace: '阿里云 ECS', icon: '🔍', color: '#8d54ff', runs: 892 },
  { id: 3, name: '客服小助手', model: 'GPT-4o mini', status: 'busy', skills: 3, tools: 4, team: '客户成功', desc: '智能客服，处理用户咨询和工单', workspace: '本地开发', icon: '💬', color: '#00c758', runs: 5621 },
  { id: 4, name: '文档生成器', model: 'Claude 3.5', status: 'idle', skills: 4, tools: 2, team: null, desc: '根据需求自动生成技术文档', workspace: 'AWS EC2', icon: '📄', color: '#f99c00', runs: 347 },
  { id: 5, name: '安全扫描员', model: 'GPT-4o', status: 'error', skills: 6, tools: 5, team: '安全合规', desc: '安全漏洞扫描与修复建议', workspace: '阿里云 ECS', icon: '🛡️', color: '#fb2c36', runs: 156 },
  { id: 6, name: '运维管家', model: 'Claude 3.5', status: 'online', skills: 7, tools: 8, team: '工程效能', desc: '服务器监控、告警处理与自动化运维', workspace: 'AWS EC2', icon: '⚙️', color: '#fe6e00', runs: 2389 },
  { id: 7, name: '翻译专家', model: 'GPT-4o mini', status: 'idle', skills: 2, tools: 1, team: null, desc: '多语言翻译，支持 30+ 语种', workspace: '本地开发', icon: '🌐', color: '#8d54ff', runs: 783 },
  { id: 8, name: '测试工程师', model: 'GPT-4o', status: 'busy', skills: 5, tools: 4, team: '工程效能', desc: '自动化测试用例生成与执行', workspace: '本地开发', icon: '🧪', color: '#00c758', runs: 645 },
];

export const workspaces: Workspace[] = [
  { id: 1, name: '本地开发环境', type: 'local', status: 'online', agents: 4, cpu: 32, mem: 58, host: 'localhost:8080', os: 'macOS 15.4' },
  { id: 2, name: '阿里云 ECS', type: 'ssh', status: 'online', agents: 3, cpu: 45, mem: 62, host: '8.219.xx.xx', os: 'Ubuntu 22.04' },
  { id: 3, name: 'AWS EC2', type: 'cloud', status: 'offline', agents: 0, cpu: 0, mem: 0, host: 'ec2-xx.compute.amazonaws.com', os: 'Amazon Linux 2' },
];

export const teams: Team[] = [
  { id: 1, name: '工程效能', mode: 'coordinator', agents: 3, status: 'active', desc: '代码审查 + 运维 + 测试协作', runs: 3826, members: [
    { icon: '🔍', color: '#8d54ff' }, { icon: '⚙️', color: '#fe6e00' }, { icon: '🧪', color: '#00c758' },
  ] },
  { id: 2, name: '数据洞察', mode: 'sequential', agents: 2, status: 'active', desc: '数据采集 → 分析 → 报告生成', runs: 1284, members: [
    { icon: '📊', color: '#fe6e00' },
  ] },
  { id: 3, name: '客户成功', mode: 'graph', agents: 2, status: 'paused', desc: '客服 + 翻译协同处理跨国工单', runs: 5621, members: [
    { icon: '💬', color: '#00c758' }, { icon: '🌐', color: '#8d54ff' },
  ] },
];

export const skills: Skill[] = [
  { name: 'Web 搜索', type: 'builtin', desc: '通过搜索引擎获取实时信息', agents: 3 },
  { name: '代码执行', type: 'builtin', desc: '在沙箱中执行 Python / JavaScript', agents: 2 },
  { name: '文件操作', type: 'builtin', desc: '读写本地和远程文件系统', agents: 4 },
  { name: 'GitHub 集成', type: 'mcp', desc: 'MCP：仓库管理、PR、Issue', agents: 2 },
  { name: '数据库查询', type: 'mcp', desc: 'MCP：SQL 执行与 schema 浏览', agents: 1 },
  { name: '飞书消息', type: 'mcp', desc: 'MCP：发送飞书消息和文档', agents: 1 },
  { name: '图像生成', type: 'custom', desc: '调用 DALL-E 3 生成图像', agents: 1 },
  { name: '语音转文字', type: 'custom', desc: 'Whisper 语音识别', agents: 0 },
];
