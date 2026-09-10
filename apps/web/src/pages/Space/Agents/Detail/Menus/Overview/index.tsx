import { memo } from 'react';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Select } from '@brierb/brier-ui';
import { deleteAgent, updateAgent, type Agent } from '@/api/generated';
import { RuntimeBadge } from '@/components/RuntimeIcon';
import { AI_RUNTIMES, MODEL_OPTIONS } from '@/define';
import { useProxy } from '@/hooks/useProxy';
import { StatusBadge } from '@/components/StatusBadge';
import { PropertyRow } from './PropertyRow';
import { Sparkline } from './Sparkline';
import { SPARKLINE_DATA, VISIBILITY_OPTIONS } from '../config';

const DEFAULT_CONCURRENT_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

export const Overview = memo(
  ({ agent, currentSpaceId }: { agent: Agent; currentSpaceId: string }) => {
    const navigate = useNavigate();
    const { modal, message } = App.useApp();

    const [getAgentProps, setAgentProps] = useProxy(agent, async (key, value) => {
      try {
        await updateAgent(currentSpaceId, agent.id, { [key]: value });
        message.success(`修改成功`);
      } catch (e) {
        message.error(e instanceof Error ? e.message : '保存失败');
      }
    });

    /** 删除 Agent：确认后调 DELETE，成功后返回列表 */
    const handleDelete = () => {
      modal.confirm({
        title: `删除 Agent「${agent.name}」`,
        content: '删除后该 Agent 将从空间移除，无法再被指派或下发任务。确定删除吗？',
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          try {
            await deleteAgent(currentSpaceId, agent.id);
            message.success('已删除');
            navigate('/space/agents');
          } catch (e) {
            message.error(e instanceof Error ? e.message : '删除失败');
          }
        },
      });
    };
    return (
      <div className="flex h-full flex-1 gap-8 overflow-hidden px-4 py-3">
        <div className="w-75 shrink-0 overflow-auto rounded-xl border border-ghost">
          <div className="flex flex-col items-start gap-2 border-b border-ghost p-4">
            <Avatar src={agent.avatar} shape="square" size={56} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold">{agent.name}</div>
                <StatusBadge status={agent.status} />
              </div>
              <p className="mt-2 text-standard">{agent.description}</p>
            </div>
          </div>

          <div className="border-b border-ghost py-3 pr-2 pl-4">
            <div className="mb-2 text-standard font-bold">属性</div>
            <div>
              <PropertyRow label="工作电脑">
                <Button bordered={false}>{agent.work_computer_name ?? '未指定'}</Button>
              </PropertyRow>
              <PropertyRow label="运行时">
                <Select
                  value={getAgentProps('runtime')}
                  onChange={setAgentProps('runtime')}
                  placeholder="未指定"
                  options={AI_RUNTIMES.map((r) => ({
                    value: r,
                    label: <RuntimeBadge name={r} size={12} />,
                  }))}
                  button={{ bordered: false }}
                />
              </PropertyRow>
              <PropertyRow label="模型">
                <Select
                  placeholder="未指定"
                  value={getAgentProps('model')}
                  onChange={setAgentProps('model')}
                  options={MODEL_OPTIONS}
                  button={{ bordered: false }}
                />
              </PropertyRow>
              <PropertyRow label="可见性">
                <Select
                  value={getAgentProps('visibility')}
                  onChange={setAgentProps('visibility')}
                  options={VISIBILITY_OPTIONS}
                  button={{ bordered: false }}
                />
              </PropertyRow>
              <PropertyRow label="并发">
                <Select
                  value={getAgentProps('concurrency')}
                  onChange={setAgentProps('concurrency')}
                  options={DEFAULT_CONCURRENT_OPTIONS}
                  button={{ bordered: false }}
                />
              </PropertyRow>
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="mb-2 text-standard font-bold">操作</div>
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-ghost py-2">
                <div className="flex-1">
                  <div className="text-standard font-medium">默认 Agent</div>
                  <p className="mt-1 text-xs">设为你的"主力" Agent — 接受指派时的默认人选</p>
                </div>
                <Button>设为默认</Button>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex-1">
                  <div className="text-standard font-medium">删除 Agent</div>
                  <p className="mt-1 text-xs">
                    删除后 Agent 会从日常列表和指派选项中隐藏，历史任务与会话记录会保留
                  </p>
                </div>
                <Button danger onClick={handleDelete}>
                  删除
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 shrink-0 overflow-auto">
          <div className="mb-6">
            <div className="mb-3 text-standard font-bold">进行中的会话</div>
            <div className="rounded-lg border border-ghost p-4">
              <p className="text-xs">当前没有进行中的会话</p>
            </div>
          </div>
          <div className="mb-6">
            <div className="mb-3 text-standard font-bold">近 30 天</div>
            <div className="rounded-lg border border-ghost p-4">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold tabular-nums">0</span>
                <span className="text-xs">次运行</span>
              </div>
              <div className="mt-2">
                <Sparkline data={SPARKLINE_DATA} />
              </div>
            </div>
          </div>
          <div>
            <div className="mb-3 text-standard font-bold">最近 Agent 事项</div>
            <div className="rounded-lg border border-ghost p-4">
              <p className="text-xs">将 Agent 事项指派给该 Agent 后，会展示在这里</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
