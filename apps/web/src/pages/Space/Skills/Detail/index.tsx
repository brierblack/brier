import { useParams, useNavigate } from 'react-router-dom';
import { App, Tag } from 'antd';
import { Button, Page } from '@brierb/ui';
import {
  ArrowLeftOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { skills } from '@/data/mockData';
import { SKILL_TYPE_MAP } from '@/define';
import type { Skill } from '@/types';

const SKILL_ICONS: Record<Skill['type'], string> = {
  builtin: '📦',
  mcp: '🔗',
  custom: '⚡',
};

const formatInstalls = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const SKILL_CONTENT: Record<Skill['type'], string[]> = {
  builtin: [
    '该技能为内置技能，无需额外安装即可在支持的环境中使用。内置技能经过深度优化，与平台核心能力紧密集成，能够提供稳定且高效的服务。',
    '在使用过程中，Agent 会根据用户的需求自动识别并调用该技能。技能的输入输出经过标准化处理，确保与其他技能和工具的兼容性。',
    '内置技能支持多轮交互，可以在一次对话中多次被调用。每次调用的结果会被记录在上下文中，便于后续步骤引用和组合。',
    '该技能的调用方式遵循统一协议，包括输入参数校验、执行超时控制、错误重试机制等。用户无需关心底层实现细节，只需描述目标即可。',
    '如需了解该技能的具体参数和返回格式，请参考技能文档的接口说明部分。在实际使用中，Agent 会自动处理参数构造和结果解析。',
  ],
  mcp: [
    '该技能基于 MCP（Model Context Protocol）协议实现，通过标准化的接口与外部系统进行通信。MCP 技能可以连接数据库、API 服务、文件系统等多种数据源。',
    'MCP 技能的执行流程包括：建立连接、发送请求、接收响应、解析数据。整个过程由 Agent 自动编排，用户只需描述目标，Agent 会选择合适的时机发起调用。',
    '该技能支持配置自定义参数，包括连接地址、认证信息、超时时间等。配置完成后，Agent 可以在对话中直接使用该技能访问目标系统。',
    '为了保证安全性，MCP 技能在执行时会进行权限校验和沙箱隔离。所有网络请求都会经过审计日志记录，便于事后追溯和调试。',
    '如需扩展该技能的能力，可以通过配置文件添加新的工具定义。每个工具对应一个独立的功能，Agent 会根据上下文自动选择合适的工具。',
  ],
  custom: [
    '该技能为自定义技能，由社区开发者创建并维护。自定义技能提供了灵活的扩展能力，可以根据具体业务需求定制功能逻辑。',
    '自定义技能的开发基于技能 SDK，开发者可以定义技能的输入参数、执行逻辑和输出格式。技能可以调用外部 API、操作文件系统、执行代码片段等。',
    '该技能的执行环境是隔离的沙箱，确保不会对宿主系统造成影响。每个技能实例拥有独立的文件系统和进程空间，执行完成后资源会自动回收。',
    '在使用该技能时，Agent 会根据技能描述自动判断适用场景。技能的描述信息越清晰，Agent 的调用准确率越高。建议在使用前仔细阅读技能文档。',
    '自定义技能支持版本管理，开发者可以发布更新版本修复问题或添加新功能。已安装的技能会自动检查更新，用户可以选择是否升级到新版本。',
  ],
};

const SkillDoc = ({ skill }: { skill: Skill }) => {
  const content = SKILL_CONTENT[skill.type];

  return (
    <>
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-label">简介</h2>
        <p className="text-sm leading-relaxed text-standard">{skill.desc}</p>
      </div>
      <div className="rounded-lg bg-surface px-4 py-3">
        <h2 className="mb-2 text-sm font-semibold text-label">内容</h2>
        <div className="flex flex-col gap-2">
          {content.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-standard">
              {p}
            </p>
          ))}
        </div>
      </div>
    </>
  );
};

const SkillDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const skill = skills.find((s) => s.name === name);

  if (!skill) {
    return (
      <Page header={<span>Skill 未找到</span>}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-standard">未找到该技能</p>
            <Button onClick={() => navigate('/space/skills')}>返回列表</Button>
          </div>
        </div>
      </Page>
    );
  }

  const cfg = SKILL_TYPE_MAP[skill.type];

  const metaItems = [
    { label: '类型', value: <Tag style={{ background: `${cfg.color}0d`, color: cfg.color, border: 'none' }}>{cfg.label}</Tag> },
    { label: '分类', value: <span className="text-sm">#{skill.category}</span> },
    { label: '版本', value: <span className="font-mono text-sm tabular-nums">{(skill.installs % 5) + 1}</span> },
    { label: '最后更新', value: <span className="text-sm">2026/8/27</span> },
    { label: '来源', value: <span className="text-sm">{skill.source === 'internal' ? '内部' : '社区'}</span> },
    { label: '作者', value: <span className="text-sm">{skill.author}</span> },
    { label: '使用中的 Agent', value: <span className="font-mono text-sm tabular-nums">{skill.agents}</span> },
  ];

  return (
    <Page
      header={
        <div className="flex items-center gap-2 py-2">
          <ArrowLeftOutlined
            className="cursor-pointer text-standard hover:text-brand"
            onClick={() => navigate('/space/skills')}
          />
          <span
            className="cursor-pointer text-standard hover:text-brand"
            onClick={() => navigate('/space/skills')}
          >
            Skill
          </span>
          <span className="text-standard">/</span>
          <span className="font-medium">{skill.name}</span>
        </div>
      }
      extra={
        <div className="flex items-center gap-2">
          <Button
            icon={<DownloadOutlined />}
            onClick={() => message.info(skill.installed ? '卸载中...' : '安装中...')}
          >
            {skill.installed ? '已安装' : '安装到 Agent'}
          </Button>
          <Button icon={<ShareAltOutlined />} onClick={() => message.info('分享链接已复制')} />
        </div>
      }
    >
      <div className="flex gap-6 overflow-hidden p-6">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{ background: `${cfg.color}0d`, border: `1px solid ${cfg.color}22` }}
            >
              {SKILL_ICONS[skill.type]}
            </div>
            <div>
              <h1 className="text-xl font-bold">{skill.name}</h1>
              <div className="mt-1 flex items-center gap-2 text-xs text-standard">
                <UserOutlined />
                <span>{skill.author}</span>
                <span>·</span>
                <InfoCircleOutlined />
                <span className="font-mono tabular-nums">{formatInstalls(skill.installs)} 次安装</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SkillDoc skill={skill} />
          </div>
        </div>

        <div className="w-64 shrink-0 overflow-y-auto">
          <div className="rounded-xl border border-ghost p-4">
            <div className="mb-3 flex items-center gap-2">
              <Tag
                style={{
                  background: `${cfg.color}0d`,
                  color: cfg.color,
                  border: 'none',
                }}
              >
                {cfg.label}
              </Tag>
            </div>
            <div className="flex flex-col gap-3">
              {metaItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-standard">{item.label}</span>
                  {item.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default SkillDetail;
