import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { Button } from '@brierb/brier-ui';
import { listAgents } from '@/api/generated';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useApi } from '@/hooks/useApi';
import {
  AutomationConfigPanel,
  type TriggerType,
  type ActionType,
  type FilterCondition,
  type TimerConfig,
} from '../shared';

const NewAutomationBody = ({ wsId }: { wsId: string }) => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { data: agents } = useApi(() => listAgents(wsId), [wsId]);

  const [title, setTitle] = useState('未命名自动化');
  const [triggerType, setTriggerType] = useState<TriggerType | null>(null);
  const [timerConfig, setTimerConfig] = useState<TimerConfig>({
    preset: 'daily-8',
    frequency: 'daily',
    hour: 8,
    minute: 0,
    timezone: 'Asia/Shanghai',
  });
  const [filters, setFilters] = useState<FilterCondition[]>([
    { id: 'filter-default', field: 'repository', operator: 'contains', value: '空间所有仓库' },
  ]);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [instructions, setInstructions] = useState('');

  const handleSave = () => {
    if (!triggerType) {
      message.warning('请选择触发条件');
      return;
    }
    if (!actionType) {
      message.warning('请选择执行动作');
      return;
    }
    message.success('自动化创建成功');
    navigate('/space/automation');
  };

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex min-h-12 shrink-0 items-center justify-between border-b border-ghost px-4">
        <div className="flex items-center gap-1.5 text-standard">
          <button
            type="button"
            onClick={() => navigate('/space/automation')}
            className="flex items-center gap-1 text-muted hover:text-standard"
          >
            <span>自动化</span>
          </button>
          <span className="text-muted">/</span>
          <span className="font-medium">新建自动化</span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/space/automation')}>取消</Button>
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="未命名自动化"
            className="w-full border-none bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-muted"
          />

          <div className="mt-6">
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
              agents={agents ?? []}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const NewAutomationContent = () => {
  const { currentWsId } = useWorkspace();
  if (!currentWsId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        请先创建工作空间
      </div>
    );
  }
  return <NewAutomationBody wsId={currentWsId} />;
};

const NewAutomation = () => {
  return <NewAutomationContent />;
};

export default NewAutomation;
