import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Segmented, Select, Table } from 'antd';
import { Button, Page, Tag } from '@brierb/ui';
import {
  ArrowLeftOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  AutomationConfigPanel,
  type TriggerType,
  type ActionType,
  type FilterCondition,
  type TimerConfig,
} from '../shared';

interface AutomationDetail {
  id: string;
  title: string;
  creator: string;
  updatedTime: string;
  status: 'enabled' | 'paused';
  triggerType: TriggerType;
  timerConfig: TimerConfig;
  filters: FilterCondition[];
  actionType: ActionType;
  instructions: string;
}

const MOCK_DETAILS: Record<string, AutomationDetail> = {
  'daily-report': {
    id: 'daily-report',
    title: '每日代码质量报告',
    creator: '芮杰',
    updatedTime: '今天 08:03',
    status: 'enabled',
    triggerType: 'timer',
    timerConfig: { preset: 'daily-8', frequency: 'daily', hour: 8, minute: 0, timezone: 'Asia/Shanghai' },
    filters: [],
    actionType: 'invoke_agent',
    instructions: '请生成今日代码质量报告，包括新增代码、修改文件和潜在问题。',
  },
  'pr-auto-review': {
    id: 'pr-auto-review',
    title: 'PR 推送自动审查',
    creator: '芮杰',
    updatedTime: '2 小时前',
    status: 'enabled',
    triggerType: 'github_push',
    timerConfig: { preset: 'daily-8', frequency: 'daily', hour: 8, minute: 0, timezone: 'Asia/Shanghai' },
    filters: [{ id: 'f1', field: 'repository', operator: 'contains', value: '空间所有仓库' }],
    actionType: 'invoke_agent',
    instructions: '请审查以下推送的代码变更，关注代码风格、潜在 bug 和性能问题。',
  },
  'comment-auto-respond': {
    id: 'comment-auto-respond',
    title: '评论自动响应',
    creator: '芮杰',
    updatedTime: '昨天 14:30',
    status: 'paused',
    triggerType: 'github_comments',
    timerConfig: { preset: 'daily-8', frequency: 'daily', hour: 8, minute: 0, timezone: 'Asia/Shanghai' },
    filters: [],
    actionType: 'create_agent_task',
    instructions: '',
  },
};

interface ExecutionRecord {
  id: string;
  triggerType: string;
  triggerObject: string;
  actionType: string;
  actionObject: string;
  time: string;
  result: 'success' | 'failed' | 'running';
  errorReason?: string;
  hasParams: boolean;
}

const MOCK_EXECUTIONS: ExecutionRecord[] = [
  { id: 'e1', triggerType: 'Push events', triggerObject: '[Push] dataphin-fe/dpapp-dev stream_new_capacity', actionType: '调用 Agent', actionObject: '调用 Agent，未生成执行对象', time: '4 分钟前', result: 'failed', errorReason: '调用 Agent 失败，错误人 web-xxx 不是当前空间成员', hasParams: true },
  { id: 'e2', triggerType: 'Push events', triggerObject: '[Push] dataphin-fe/dpapp-dev stream_new_capacity', actionType: '调用 Agent', actionObject: '调用 Agent，未生成执行对象', time: '5 分钟前', result: 'failed', errorReason: '调用 Agent 失败，错误人 web-xxx 不是当前空间成员', hasParams: true },
  { id: 'e3', triggerType: 'Push events', triggerObject: '[Push] dataphin-fe/dpapp-dev stream_new_capacity', actionType: '调用 Agent', actionObject: '调用 Agent，未生成执行对象', time: '8 分钟前', result: 'failed', errorReason: '调用 Agent 失败，错误人 web-xxx 不是当前空间成员', hasParams: true },
  { id: 'e4', triggerType: 'Push events', triggerObject: '[Push] dataphin-fe/dpapp-dev stream_new_capacity', actionType: '调用 Agent', actionObject: '调用 Agent，未生成执行对象', time: '9 分钟前', result: 'failed', errorReason: '调用 Agent 失败，错误人 web-xxx 不是当前空间成员', hasParams: true },
  { id: 'e5', triggerType: 'Push events', triggerObject: '[Push] dataphin-fe/dpapp-dev stream_new_capacity', actionType: '调用 Agent', actionObject: '调用 Agent，未生成执行对象', time: '10 分钟前', result: 'failed', errorReason: '调用 Agent 失败，错误人 web-xxx 不是当前空间成员', hasParams: true },
  { id: 'e6', triggerType: 'Push events', triggerObject: '[Push] dataphin-fe/dpapp-dev stream_new_capacity', actionType: '调用 Agent', actionObject: '调用 Agent，未生成执行对象', time: '11 分钟前', result: 'failed', errorReason: '调用 Agent 失败，错误人 web-xxx 不是当前空间成员', hasParams: true },
];

interface DailyStat {
  date: string;
  success: number;
  failed: number;
  running: number;
}

const MOCK_DAILY_STATS: DailyStat[] = [
  { date: '8/21', success: 0, failed: 0, running: 0 },
  { date: '8/22', success: 0, failed: 0, running: 0 },
  { date: '8/23', success: 0, failed: 0, running: 0 },
  { date: '8/24', success: 0, failed: 0, running: 0 },
  { date: '8/25', success: 0, failed: 0, running: 0 },
  { date: '8/26', success: 0, failed: 0, running: 0 },
  { date: '8/27', success: 0, failed: 6, running: 0 },
];

interface ModificationRecord {
  id: string;
  user: string;
  action: string;
  detail?: string;
  time: string;
}

const MOCK_MODIFICATIONS: ModificationRecord[] = [
  { id: 'm1', user: '芮杰', action: '创建了自动化', time: '19 分钟前' },
  { id: 'm2', user: '芮杰', action: '修改了执行指令', detail: '更新了执行指令内容', time: '15 分钟前' },
  { id: 'm3', user: '芮杰', action: '修改了触发条件', detail: '添加了仓库筛选条件', time: '12 分钟前' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
  { value: 'running', label: '执行中' },
];

const RESULT_TAG: Record<string, { color: string; text: string }> = {
  success: { color: 'green', text: '成功' },
  failed: { color: 'red', text: '失败' },
  running: { color: 'blue', text: '执行中' },
};

const BarChart = ({ data }: { data: DailyStat[] }) => {
  const maxValue = Math.max(...data.map((d) => d.success + d.failed + d.running), 1);

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-emerald-500" />成功
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-red-500" />失败
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-blue-400" />执行中
        </span>
      </div>
      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {data.map((d) => {
          const total = d.success + d.failed + d.running;
          const heightPct = total > 0 ? (total / maxValue) * 100 : 0;
          return (
            <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end">
              <div
                className="flex w-full flex-col justify-end overflow-hidden rounded-t"
                style={{ height: total > 0 ? `${heightPct}%` : '2px', minHeight: '2px' }}
              >
                {total > 0 && d.running > 0 && (
                  <div style={{ height: `${(d.running / total) * 100}%` }} className="w-full bg-blue-400" />
                )}
                {total > 0 && d.success > 0 && (
                  <div style={{ height: `${(d.success / total) * 100}%` }} className="w-full bg-emerald-500" />
                )}
                {total > 0 && d.failed > 0 && (
                  <div style={{ height: `${(d.failed / total) * 100}%` }} className="w-full bg-red-500" />
                )}
              </div>
              <span className="mt-1 text-xs text-muted">{d.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ConfigTab = ({ automation }: { automation: AutomationDetail }) => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [title, setTitle] = useState(automation.title);
  const [triggerType, setTriggerType] = useState<TriggerType>(automation.triggerType);
  const [timerConfig, setTimerConfig] = useState<TimerConfig>(automation.timerConfig);
  const [filters, setFilters] = useState<FilterCondition[]>(automation.filters);
  const [actionType, setActionType] = useState<ActionType>(automation.actionType);
  const [instructions, setInstructions] = useState(automation.instructions);

  return (
    <div className="mx-auto max-w-[720px] p-6">
      <div className="mb-6 flex items-center justify-between">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-none bg-transparent text-2xl font-bold tracking-tight outline-none"
        />
        <Button
          type="primary"
          onClick={() => {
            message.success('配置已保存');
            navigate('/space/automation');
          }}
        >
          保存
        </Button>
      </div>

      <AutomationConfigPanel
        triggerType={triggerType}
        onTriggerTypeChange={setTriggerType}
        timerConfig={timerConfig}
        onTimerConfigChange={setTimerConfig}
        filters={filters}
        onFiltersChange={setFilters}
        actionType={actionType}
        onActionTypeChange={setActionType}
        instructions={instructions}
        onInstructionsChange={setInstructions}
      />
    </div>
  );
};

const ExecutionRecordsTab = () => {
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredExecutions = useMemo(() => {
    if (statusFilter === 'all') return MOCK_EXECUTIONS;
    return MOCK_EXECUTIONS.filter((e) => e.result === statusFilter);
  }, [statusFilter]);

  const total = MOCK_EXECUTIONS.length;
  const successCount = MOCK_EXECUTIONS.filter((e) => e.result === 'success').length;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;

  const columns: ColumnsType<ExecutionRecord> = [
    {
      title: '触发类型',
      dataIndex: 'triggerType',
      width: 120,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '触发对象',
      dataIndex: 'triggerObject',
      ellipsis: true,
    },
    {
      title: '动作类型',
      dataIndex: 'actionType',
      width: 100,
      render: (text: string) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: '动作对象',
      dataIndex: 'actionObject',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'time',
      width: 100,
    },
    {
      title: '执行结果',
      dataIndex: 'result',
      width: 80,
      render: (result: string) => {
        const tag = RESULT_TAG[result];
        return <Tag color={tag.color}>{tag.text}</Tag>;
      },
    },
    {
      title: '参数',
      dataIndex: 'hasParams',
      width: 60,
      render: (hasParams: boolean) =>
        hasParams ? (
          <span className="cursor-pointer text-xs text-brand hover:underline">查看</span>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-6">
        <span className="text-sm">
          执行 <span className="font-bold text-standard">{total}</span> 次, 成功率{' '}
          <span className="font-bold text-red-500">{successRate}%</span>
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-ghost bg-white p-4">
        <BarChart data={MOCK_DAILY_STATS} />
      </div>

      <div className="mb-3 flex items-center gap-3">
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTER_OPTIONS}
          style={{ width: 120 }}
        />
        <span className="text-xs text-muted">8/21 - 8/27</span>
        <Button type="text" icon={<ReloadOutlined />} className="ml-auto">
          刷新
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredExecutions}
        pagination={false}
        size="small"
        expandable={{
          expandedRowRender: (record) =>
            record.errorReason ? (
              <div className="px-4 py-2 text-sm text-red-600">
                <span className="font-medium">原因: </span>
                {record.errorReason}
              </div>
            ) : null,
          rowExpandable: (record) => !!record.errorReason,
        }}
      />
    </div>
  );
};

const ModificationRecordsTab = () => {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-3">
        {MOCK_MODIFICATIONS.map((record) => (
          <div
            key={record.id}
            className="flex items-start gap-3 rounded-lg border border-ghost bg-white p-4"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <span className="text-xs font-medium">{record.user.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-medium text-standard">{record.user}</span>
                <span className="ml-1 text-standard">{record.action}</span>
              </div>
              {record.detail && (
                <div className="mt-1 text-xs text-muted">{record.detail}</div>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted">{record.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AutomationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('config');

  const automation = useMemo(() => MOCK_DETAILS[id ?? ''], [id]);

  if (!automation) {
    return (
      <Page header={<span>自动化未找到</span>}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-standard">未找到该自动化</p>
            <Button onClick={() => navigate('/space/automation')}>返回列表</Button>
          </div>
        </div>
      </Page>
    );
  }

  const isEnabled = automation.status === 'enabled';
  const executionCount = MOCK_EXECUTIONS.length;

  const handleToggleStatus = () => {
    message.success(isEnabled ? '已暂停' : '已启用');
  };

  const handleDelete = () => {
    message.success('已删除');
    navigate('/space/automation');
  };

  return (
    <Page
      header={
        <div className="flex items-center gap-3 py-2.5">
          <Button
            bordered={false}
            icon={
              <ArrowLeftOutlined
                className="shrink-0 cursor-pointer text-standard hover:text-brand"
                onClick={() => navigate('/space/automation')}
              />
            }
          />
          <div className="flex-1">
            <h1 className="m-0 text-lg font-bold">{automation.title}</h1>
            <p className="mt-0.5 text-xs text-muted">
              {automation.creator}·创建 · 更新于 {automation.updatedTime}
            </p>
          </div>
        </div>
      }
      extra={
        <div className="flex items-center gap-2">
          <Button
            icon={isEnabled ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={handleToggleStatus}
          >
            {isEnabled ? '暂停' : '启用'}
          </Button>
          {automation.triggerType.startsWith('github_') && (
            <Button icon={<ApiOutlined />}>配置 Webhook</Button>
          )}
          <Button type="text" danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除
          </Button>
        </div>
      }
    >
      <div className="overflow-hidden">
        <div className="px-4 pt-3">
          <Segmented
            value={activeTab}
            onChange={(value) => setActiveTab(value as string)}
            options={[
              { label: '配置', value: 'config' },
              {
                label: (
                  <span className="flex items-center gap-1">
                    执行记录
                    <span className="flex size-4 items-center justify-center rounded-full bg-brand/10 text-[10px] font-medium text-brand">
                      {executionCount}
                    </span>
                  </span>
                ),
                value: 'executions',
              },
              { label: '修改记录', value: 'history' },
            ]}
          />
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === 'config' && <ConfigTab automation={automation} />}
          {activeTab === 'executions' && <ExecutionRecordsTab />}
          {activeTab === 'history' && <ModificationRecordsTab />}
        </div>
      </div>
    </Page>
  );
};

export default AutomationDetail;
