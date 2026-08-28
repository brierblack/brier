import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Select, type MenuProps } from 'antd';
import {
  ClockCircleOutlined,
  GithubOutlined,
  BranchesOutlined,
  PullRequestOutlined,
  CommentOutlined,
  RobotOutlined,
  ScheduleOutlined,
  DownOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { agents } from '../../../data/mockData';
import { Dropdown } from '@brierb/brier-ui';

export type TriggerType = 'timer' | 'github_push' | 'github_pullrequest' | 'github_comments';
export type ActionType = 'invoke_agent' | 'create_agent_task';

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface TimerConfig {
  preset: string | null;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'workday';
  hour: number;
  minute: number;
  timezone: string;
}

export const TRIGGER_DISPLAY: Record<TriggerType, { icon: ReactNode; label: string }> = {
  timer: { icon: <ClockCircleOutlined />, label: '定时' },
  github_push: { icon: <BranchesOutlined />, label: 'Push events' },
  github_pullrequest: { icon: <PullRequestOutlined />, label: 'Pull Request' },
  github_comments: { icon: <CommentOutlined />, label: 'Comments' },
};

export const ACTION_DISPLAY: Record<ActionType, { icon: ReactNode; label: string; desc: string }> =
  {
    invoke_agent: {
      icon: <RobotOutlined />,
      label: '调用 Agent',
      desc: '按触发条件向指定 Agent 发送执行指令',
    },
    create_agent_task: {
      icon: <ScheduleOutlined />,
      label: '创建 Agent 事项',
      desc: '触发时自动创建 Agent 事项并指派给处理人',
    },
  };

export const TIME_PRESETS = [
  { key: 'hourly', label: '每小时', frequency: 'hourly' as const, hour: 0, minute: 0 },
  { key: 'daily-8', label: '每天 8:00', frequency: 'daily' as const, hour: 8, minute: 0 },
  { key: 'daily-10', label: '每天 10:00', frequency: 'daily' as const, hour: 10, minute: 0 },
  { key: 'daily-18', label: '每天 18:00', frequency: 'daily' as const, hour: 18, minute: 0 },
  { key: 'workday-9', label: '工作日 9:00', frequency: 'workday' as const, hour: 9, minute: 0 },
  { key: 'weekly-mon-9', label: '每周一 9:00', frequency: 'weekly' as const, hour: 9, minute: 0 },
  { key: 'monthly-1-8', label: '每月1日 8:00', frequency: 'monthly' as const, hour: 8, minute: 0 },
];

export const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: '每小时' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'workday', label: '工作日' },
];

export type GitHubTriggerType = 'github_push' | 'github_pullrequest' | 'github_comments';

export const FIELD_OPTIONS_BY_TRIGGER: Record<
  GitHubTriggerType,
  { value: string; label: string }[]
> = {
  github_push: [
    { value: 'committer', label: '提交人' },
    { value: 'branch', label: '分支' },
  ],
  github_pullrequest: [
    { value: 'committer', label: '提交人' },
    { value: 'reviewer', label: '评审人' },
    { value: 'action', label: '动作' },
    { value: 'updated_action', label: '更新动作' },
    { value: 'source_branch', label: '源分支' },
    { value: 'target_branch', label: '目标分支' },
    { value: 'title', label: '标题' },
  ],
  github_comments: [
    { value: 'repository', label: '仓库' },
    { value: 'branch', label: '分支' },
    { value: 'path', label: '路径' },
    { value: 'author', label: '作者' },
    { value: 'commit_message', label: 'Commit Message' },
  ],
};

export const OPERATOR_OPTIONS = [
  { value: 'contains', label: '包含' },
  { value: 'equals', label: '等于' },
  { value: 'starts_with', label: '开头是' },
  { value: 'ends_with', label: '结尾是' },
  { value: 'regex', label: '正则匹配' },
];

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));

export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));

const pad2 = (n: number) => String(n).padStart(2, '0');

export function getNextExecutions(
  frequency: TimerConfig['frequency'],
  hour: number,
  minute: number,
  count = 5,
): string[] {
  const now = new Date();
  const results: string[] = [];

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  const next = new Date(now);

  switch (frequency) {
    case 'hourly': {
      next.setMinutes(minute, 0, 0);
      if (next <= now) next.setHours(next.getHours() + 1);
      for (let i = 0; i < count; i++) {
        results.push(fmt(next));
        next.setHours(next.getHours() + 1);
      }
      break;
    }
    case 'daily': {
      next.setHours(hour, minute, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      for (let i = 0; i < count; i++) {
        results.push(fmt(next));
        next.setDate(next.getDate() + 1);
      }
      break;
    }
    case 'weekly': {
      next.setHours(hour, minute, 0, 0);
      const day = next.getDay();
      const daysUntilMon = day === 1 ? (next > now ? 0 : 7) : (8 - day) % 7;
      next.setDate(next.getDate() + daysUntilMon);
      if (next <= now) next.setDate(next.getDate() + 7);
      for (let i = 0; i < count; i++) {
        results.push(fmt(next));
        next.setDate(next.getDate() + 7);
      }
      break;
    }
    case 'monthly': {
      next.setHours(hour, minute, 0, 0);
      next.setDate(1);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      for (let i = 0; i < count; i++) {
        results.push(fmt(next));
        next.setMonth(next.getMonth() + 1);
      }
      break;
    }
    case 'workday': {
      next.setHours(hour, minute, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
      for (let i = 0; i < count; i++) {
        results.push(fmt(next));
        next.setDate(next.getDate() + 1);
        while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
      }
      break;
    }
  }

  return results;
}

export const SectionCard = ({ title, children }: { title: ReactNode; children: ReactNode }) => (
  <div className="mb-6">
    <div className="mb-3 text-standard font-bold">{title}</div>
    <div className="rounded-xl border border-ghost bg-white p-5">{children}</div>
  </div>
);

export const TriggerSelector = ({
  value,
  onChange,
}: {
  value: TriggerType | null;
  onChange: (v: TriggerType) => void;
}) => {
  const [open, setOpen] = useState(false);

  const menuItems: MenuProps['items'] = [
    { key: 'timer', icon: <ClockCircleOutlined />, label: '定时' },
    {
      key: 'github',
      icon: <GithubOutlined />,
      label: 'AntCode',
      children: [
        { key: 'github_push', icon: <BranchesOutlined />, label: 'PushEvent' },
        { key: 'github_pullrequest', icon: <PullRequestOutlined />, label: 'PullRequest' },
        { key: 'github_comments', icon: <CommentOutlined />, label: 'Comments' },
      ],
    },
  ];

  const selected = value ? TRIGGER_DISPLAY[value] : null;

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: ({ key }) => {
          onChange(key as TriggerType);
          setOpen(false);
        },
      }}
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      overlayClassName="rounded-lg! border! border-ghost! shadow-md!"
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg border border-ghost bg-white px-3 py-2 text-sm transition-colors hover:border-brand"
      >
        {selected ? (
          <>
            <span className="text-brand">{selected.icon}</span>
            <span className="text-standard">{selected.label}</span>
          </>
        ) : (
          <span className="text-muted">选择触发事件...</span>
        )}
        <DownOutlined className="ml-auto text-xs text-muted" />
      </button>
    </Dropdown>
  );
};

export const TimerConfigPanel = ({
  config,
  onConfigChange,
}: {
  config: TimerConfig;
  onConfigChange: (config: TimerConfig) => void;
}) => {
  const nextExecutions = useMemo(
    () => getNextExecutions(config.frequency, config.hour, config.minute),
    [config.frequency, config.hour, config.minute],
  );

  const handlePresetClick = (preset: (typeof TIME_PRESETS)[0]) => {
    onConfigChange({
      ...config,
      preset: preset.key,
      frequency: preset.frequency,
      hour: preset.hour,
      minute: preset.minute,
    });
  };

  const isPresetActive = (preset: (typeof TIME_PRESETS)[0]) => {
    if (config.preset === preset.key) return true;
    return (
      config.preset === null &&
      config.frequency === preset.frequency &&
      config.hour === preset.hour &&
      config.minute === preset.minute
    );
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        {TIME_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              isPresetActive(preset)
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-ghost text-standard hover:border-brand'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">频率</span>
          <Select
            value={config.frequency}
            onChange={(v) =>
              onConfigChange({ ...config, preset: null, frequency: v as TimerConfig['frequency'] })
            }
            options={FREQUENCY_OPTIONS}
            style={{ width: 120 }}
          />
        </div>
        <div className="flex items-center gap-1">
          <Select
            value={config.hour}
            onChange={(v) => onConfigChange({ ...config, preset: null, hour: v })}
            options={HOUR_OPTIONS}
            style={{ width: 64 }}
          />
          <span className="text-standard">:</span>
          <Select
            value={config.minute}
            onChange={(v) => onConfigChange({ ...config, preset: null, minute: v })}
            options={MINUTE_OPTIONS}
            style={{ width: 64 }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">接下来执行:</span>
        {nextExecutions.map((time) => (
          <span
            key={time}
            className="rounded bg-[#f5f5f5] px-2 py-0.5 font-mono text-xs tabular-nums"
          >
            {time}
          </span>
        ))}
      </div>

      <div className="text-xs text-muted">{config.timezone} (北京时间)</div>
    </div>
  );
};

export const GitHubFiltersPanel = ({
  triggerType,
  filters,
  onFiltersChange,
}: {
  triggerType: GitHubTriggerType;
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
}) => {
  const fieldOptions = FIELD_OPTIONS_BY_TRIGGER[triggerType];

  const addFilter = () => {
    onFiltersChange([
      ...filters,
      { id: `filter-${Date.now()}`, field: fieldOptions[0].value, operator: 'contains', value: '' },
    ]);
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, patch: Partial<FilterCondition>) => {
    onFiltersChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="text-standard font-medium">筛选条件</div>
      {filters.length === 0 && (
        <div className="text-xs text-muted">未设置筛选条件，将匹配所有事件</div>
      )}
      {filters.map((filter) => (
        <div key={filter.id} className="flex items-center gap-2">
          <Select
            value={filter.field}
            onChange={(v) => updateFilter(filter.id, { field: v })}
            options={fieldOptions}
            style={{ width: 140 }}
            variant="filled"
          />
          <Select
            value={filter.operator}
            onChange={(v) => updateFilter(filter.id, { operator: v })}
            options={OPERATOR_OPTIONS}
            style={{ width: 120 }}
            variant="filled"
          />
          <input
            value={filter.value}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            placeholder="输入匹配值"
            className="min-w-0 flex-1 rounded-md border border-ghost bg-white px-2 py-1 text-sm outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={() => removeFilter(filter.id)}
            className="flex shrink-0 items-center justify-center rounded p-1 text-muted hover:text-danger"
          >
            <DeleteOutlined />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addFilter}
        className="flex items-center gap-1 text-xs text-brand hover:underline"
      >
        <PlusOutlined />
        添加筛选条件
      </button>
    </div>
  );
};

export const ActionSelector = ({
  value,
  onChange,
}: {
  value: ActionType | null;
  onChange: (v: ActionType) => void;
}) => {
  const [open, setOpen] = useState(false);

  const menuItems: MenuProps['items'] = (Object.keys(ACTION_DISPLAY) as ActionType[]).map((key) => {
    const opt = ACTION_DISPLAY[key];
    return {
      key,
      label: (
        <div className="flex items-start gap-2.5 py-1">
          <span className="mt-0.5 text-base text-brand">{opt.icon}</span>
          <div className="flex-1">
            <div className="text-standard font-medium">{opt.label}</div>
            <div className="mt-0.5 text-xs text-muted">{opt.desc}</div>
          </div>
          {value === key && <CheckOutlined className="mt-1 text-brand" />}
        </div>
      ),
    };
  });

  const selected = value ? ACTION_DISPLAY[value] : null;

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: ({ key }) => {
          onChange(key as ActionType);
          setOpen(false);
        },
        selectedKeys: value ? [value] : [],
      }}
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      overlayClassName="rounded-lg! border! border-ghost! shadow-md! min-w-[320px]!"
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg border border-ghost bg-white px-3 py-2 text-sm transition-colors hover:border-brand"
      >
        {selected ? (
          <>
            <span className="text-brand">{selected.icon}</span>
            <span className="text-standard">{selected.label}</span>
          </>
        ) : (
          <span className="text-muted">选择执行动作...</span>
        )}
        <DownOutlined className="ml-auto text-xs text-muted" />
      </button>
    </Dropdown>
  );
};

export const InstructionEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedAgent, setSelectedAgent] = useState<number | undefined>();

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const insertText = `{{${variable}}}`;
    const newValue = value.slice(0, start) + insertText + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + insertText.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  const VARIABLES = [
    { label: '事件类型', value: '事件类型' },
    { label: '当前 Studio 空间 ID', value: '当前 Studio 空间 ID' },
  ];

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">执行人</span>
        <Select
          value={selectedAgent}
          onChange={setSelectedAgent}
          placeholder="选择执行人..."
          options={agents.map((a) => ({
            value: a.id,
            label: (
              <span className="flex items-center gap-2">
                <span>{a.icon}</span>
                <span>{a.name}</span>
              </span>
            ),
          }))}
          style={{ width: 240 }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Dropdown
          menu={{
            items: VARIABLES.map((v) => ({ key: v.value, label: v.label })),
            onClick: ({ key }) => insertVariable(key),
          }}
          trigger={['click']}
        >
          <button
            type="button"
            className="flex items-center gap-1 rounded border border-ghost px-2 py-0.5 text-xs hover:border-brand"
          >
            <PlusOutlined />
            插入变量
            <DownOutlined className="text-[10px]" />
          </button>
        </Dropdown>
        {VARIABLES.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => insertVariable(v.value)}
            className="rounded border border-ghost px-2 py-0.5 text-xs hover:border-brand"
          >
            {v.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="写给 Agent 的执行指令，可用「插入变量」嵌入工作项信息..."
        rows={4}
        className="w-full resize-none rounded-lg border border-ghost bg-white p-3 text-sm outline-none focus:border-brand"
      />
    </div>
  );
};

export interface AutomationConfigPanelProps {
  triggerType: TriggerType | null;
  onTriggerTypeChange: (v: TriggerType) => void;
  timerConfig: TimerConfig;
  onTimerConfigChange: (v: TimerConfig) => void;
  filters: FilterCondition[];
  onFiltersChange: (v: FilterCondition[]) => void;
  actionType: ActionType | null;
  onActionTypeChange: (v: ActionType) => void;
  instructions: string;
  onInstructionsChange: (v: string) => void;
}

export const AutomationConfigPanel = ({
  triggerType,
  onTriggerTypeChange,
  timerConfig,
  onTimerConfigChange,
  filters,
  onFiltersChange,
  actionType,
  onActionTypeChange,
  instructions,
  onInstructionsChange,
}: AutomationConfigPanelProps) => {
  const isGitHubTrigger = (t: TriggerType | null): t is GitHubTriggerType =>
    t !== null && t !== 'timer';

  const handleTriggerTypeChange = (v: TriggerType) => {
    onTriggerTypeChange(v);
    if (v !== 'timer') {
      const fieldOptions = FIELD_OPTIONS_BY_TRIGGER[v as GitHubTriggerType];
      onFiltersChange([
        {
          id: `filter-${Date.now()}`,
          field: fieldOptions[0].value,
          operator: 'contains',
          value: '',
        },
      ]);
    }
  };

  return (
    <>
      <SectionCard title="触发条件">
        <TriggerSelector value={triggerType} onChange={handleTriggerTypeChange} />
        {triggerType === 'timer' && (
          <TimerConfigPanel config={timerConfig} onConfigChange={onTimerConfigChange} />
        )}
        {isGitHubTrigger(triggerType) && (
          <GitHubFiltersPanel
            triggerType={triggerType}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        )}
      </SectionCard>

      <SectionCard title="执行动作">
        <ActionSelector value={actionType} onChange={onActionTypeChange} />
        {actionType === 'invoke_agent' && (
          <InstructionEditor value={instructions} onChange={onInstructionsChange} />
        )}
        {actionType === 'create_agent_task' && (
          <div className="mt-4 rounded-lg border border-dashed border-ghost p-4 text-center text-sm text-muted">
            创建 Agent 事项配置（敬请期待）
          </div>
        )}
      </SectionCard>
    </>
  );
};
