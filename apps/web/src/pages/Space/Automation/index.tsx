import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { Button, Page } from '@brierb/brier-ui';
import {
  PlusOutlined,
  SettingOutlined,
  SyncOutlined,
  PullRequestOutlined,
  WarningOutlined,
  RocketOutlined,
  FileTextOutlined,
  DownOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  CommentOutlined,
} from '@ant-design/icons';

interface Template {
  id: string;
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  desc: string;
  status?: 'enabled' | 'coming-soon';
}

interface AutomationTask {
  id: string;
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  trigger: string;
  action: string;
  status: 'enabled' | 'paused';
  lastRun?: string;
}

const OFFICIAL_TEMPLATES: Template[] = [
  {
    id: 'sync-dima',
    icon: <SyncOutlined />,
    iconColor: '#1677ff',
    title: '自动同步 Dima 工作项',
    desc: 'Dima 工作项 → 创建 Agent 事项',
    status: 'enabled',
  },
];

const SPACE_AUTOMATIONS: AutomationTask[] = [
  {
    id: 'daily-report',
    icon: <ClockCircleOutlined />,
    iconColor: '#1677ff',
    title: '每日代码质量报告',
    trigger: '定时',
    action: '调用 Agent',
    status: 'enabled',
    lastRun: '今天 08:03',
  },
  {
    id: 'pr-auto-review',
    icon: <BranchesOutlined />,
    iconColor: '#52c41a',
    title: 'PR 推送自动审查',
    trigger: 'Push events',
    action: '调用 Agent',
    status: 'enabled',
    lastRun: '2 小时前',
  },
  {
    id: 'comment-auto-respond',
    icon: <CommentOutlined />,
    iconColor: '#faad14',
    title: '评论自动响应',
    trigger: 'Comments',
    action: '创建 Agent 事项',
    status: 'paused',
    lastRun: '昨天 14:30',
  },
];

const COMMUNITY_TEMPLATES: Template[] = [
  {
    id: 'pr-review',
    icon: <PullRequestOutlined />,
    iconColor: '#1677ff',
    title: 'PR 变更时自动 Review',
    desc: '当代码仓库有 PR 创建或更新时，直接调用 PR 作者的默认 Agent 审查代码并给出评审意见',
  },
  {
    id: 'alert-troubleshoot',
    icon: <WarningOutlined />,
    iconColor: '#faad14',
    title: '应用告警时自动排查',
    desc: '收到应用告警时，自动创建排查任务，让 Agent 分析日志、定位问题并给出修复建议',
  },
  {
    id: 'staging-verify',
    icon: <RocketOutlined />,
    iconColor: '#52c41a',
    title: '预发部署后自动验证',
    desc: '预发环境部署完成后，自动创建回归验证任务，让 Agent 检查核心功能是否正常',
    status: 'coming-soon',
  },
  {
    id: 'prod-changelog',
    icon: <FileTextOutlined />,
    iconColor: '#722ed1',
    title: '生产部署后自动记录',
    desc: '生产环境部署完成后，自动生成变更记录，汇总本次发布包含的 PR 和关联工单',
    status: 'coming-soon',
  },
];

const TemplateCard = ({ template }: { template: Template }) => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const disabled = template.status === 'coming-soon';

  const handleClick = () => {
    if (disabled) {
      message.info('该模板敬请期待');
      return;
    }
    navigate('/space/automation/new');
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 rounded-xl border border-ghost bg-white p-4 transition-shadow hover:shadow-md ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-base"
        style={{
          background: `${template.iconColor}0d`,
          border: `1px solid ${template.iconColor}22`,
          color: template.iconColor,
        }}
      >
        {template.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-standard font-medium">{template.title}</div>
        <p className="mt-1 text-xs leading-relaxed">{template.desc}</p>
      </div>
      {template.status === 'enabled' && (
        <span className="shrink-0 rounded-md bg-[#f0f0f0] px-2 py-0.5 text-xs font-medium">
          启用
        </span>
      )}
      {template.status === 'coming-soon' && <span className="shrink-0 text-xs">敬请期待</span>}
    </div>
  );
};

const AutomationTaskCard = ({ task }: { task: AutomationTask }) => {
  const navigate = useNavigate();
  const isPaused = task.status === 'paused';

  return (
    <div
      onClick={() => navigate(`/space/automation/${task.id}`)}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-ghost bg-white p-4 transition-shadow"
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-base"
        style={{
          background: `${task.iconColor}0d`,
          border: `1px solid ${task.iconColor}22`,
          color: task.iconColor,
        }}
      >
        {task.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-standard font-medium">{task.title}</div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span>{task.trigger}</span>
          <span className="text-muted">→</span>
          <span>{task.action}</span>
          {task.lastRun && (
            <>
              <span className="text-muted">·</span>
              <span className="text-muted">上次执行 {task.lastRun}</span>
            </>
          )}
        </div>
      </div>
      <span
        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
          isPaused ? 'bg-[#f5f5f5] text-muted' : 'bg-emerald-500/10 text-emerald-700'
        }`}
      >
        {isPaused ? '已暂停' : '运行中'}
      </span>
    </div>
  );
};

const Automation = () => {
  const navigate = useNavigate();

  return (
    <Page
      title="自动化"
      subtitle="让 Agent 自动执行重复性任务，或响应外部事件"
      extra={
        <div className="flex items-center gap-2">
          <Button type="text" icon={<SettingOutlined />} />
          <Button
            type="primary"
            onClick={() => navigate('/space/automation/new')}
            className="flex items-center gap-1"
          >
            <PlusOutlined />
            新建自动化
            <DownOutlined className="text-xs" />
          </Button>
        </div>
      }
    >
      <div className="relative mx-auto p-4">
        <div className="mb-6">
          <div className="mb-3 text-standard font-bold">Studio 官方</div>
          <div className="flex flex-col gap-3">
            {OFFICIAL_TEMPLATES.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 text-standard font-bold">空间（运行中）</div>
          <div className="flex flex-col gap-3">
            {SPACE_AUTOMATIONS.map((t) => (
              <AutomationTaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 text-standard font-bold">从模板开始</div>
          <div className="flex flex-col gap-3">
            {COMMUNITY_TEMPLATES.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/space/automation/new')}
        className="fixed right-6 bottom-6 z-50 flex size-12 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-110"
      >
        <PlusOutlined className="text-[20px]" />
      </button>
    </Page>
  );
};

export default Automation;
