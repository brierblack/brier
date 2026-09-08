import { memo } from 'react';
import { App } from 'antd';
import { Avatar, Button, Select } from '@brierb/brier-ui';
import { SPARKLINE_DATA, VISIBILITY_OPTIONS } from '../config';
import { deleteAgent, updateAgent, type Agent, type UpdateAgentRequest } from '@/api/generated';
import { RuntimeBadge } from '@/components/RuntimeIcon';
import { AI_RUNTIMES, MODEL_OPTIONS } from '@/define';
import { useImmediateSave } from '@/hooks/useImmediateSave';
import { StatusBadge } from '@/components/StatusBadge';
import { PropertyRow } from './PropertyRow';
import { Sparkline } from './Sparkline';
import { useNavigate } from 'react-router-dom';

type VisibilityKey = (typeof VISIBILITY_OPTIONS)[number]['value'];

/** agent.visibility + public_scope → 详情档位组合值（public + 历史空 scope 兜底 all） */
const toVisibilityKey = (agent: Agent): VisibilityKey =>
  agent.visibility === 'public'
    ? agent.public_scope === 'joined_spaces'
      ? 'public-joined'
      : 'public-all'
    : 'private';

/** 详情档位组合值 → updateAgent patch 字段 */
const fromVisibilityKey = (
  key: VisibilityKey,
): Pick<UpdateAgentRequest, 'visibility' | 'public_scope'> =>
  key === 'private'
    ? { visibility: 'private' }
    : {
        visibility: 'public',
        public_scope: key === 'public-joined' ? 'joined_spaces' : 'all',
      };

export const Overview = memo(
  ({ agent, currentSpaceId }: { agent: Agent; currentSpaceId: string }) => {
    const navigate = useNavigate();
    const { modal, message } = App.useApp();

    /** 属性行"切换即保存"：值来自 agent 接口，变更即 patch，乐观更新失败自动回滚 */
    const failTip = (e: unknown) => {
      message.error(e instanceof Error ? e.message : '保存失败');
      throw e;
    };

    /** 运行时：null = 未指定（无清空入口），切换即保存 */
    const runtime = useImmediateSave<string | null>(agent.runtime ?? null, async (next) => {
      if (!next) return;
      try {
        await updateAgent(currentSpaceId, agent.id, { runtime: next });
        message.success(`运行时已切换为 ${next}`);
      } catch (e) {
        failTip(e);
      }
    });

    /** 模型：null = 由 runtime 自己决定，切换即保存 */
    const model = useImmediateSave<string | null>(agent.model ?? null, async (next) => {
      try {
        await updateAgent(currentSpaceId, agent.id, { model: next });
        message.success(next ? `已设为 ${next}` : '已改为由 runtime 自己决定');
      } catch (e) {
        failTip(e);
      }
    });

    /** 可见性：specified 无选空间入口，仅在该状态时只读展示 */
    const specifiedVisibility =
      agent.visibility === 'public' && agent.public_scope === 'specified_spaces';
    const visibility = useImmediateSave<VisibilityKey | null>(
      specifiedVisibility ? null : toVisibilityKey(agent),
      async (next) => {
        if (!next) return;
        try {
          await updateAgent(currentSpaceId, agent.id, fromVisibilityKey(next));
          message.success('可见性已更新');
        } catch (e) {
          failTip(e);
        }
      },
    );

    /** 删除 Agent：确认后调 DELETE，成功后返回列表 */
    const handleDelete = () => {
      if (!agent) return;
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

          <div className="border-b border-ghost px-4 py-3">
            <div className="mb-2 text-standard font-bold">属性</div>
            <div>
              <PropertyRow label="工作电脑">
                <Button bordered={false}>{agent.work_computer_name ?? '—'}</Button>
              </PropertyRow>
              <PropertyRow label="运行时">
                <Select
                  value={runtime.value}
                  onChange={runtime.change}
                  placeholder="未指定"
                  options={AI_RUNTIMES.map((r) => ({
                    value: r,
                    label: <RuntimeBadge name={r} size={12} />,
                  }))}
                  button={{
                    bordered: false,
                  }}
                />
              </PropertyRow>
              <PropertyRow label="模型">
                <Select
                  value={model.value}
                  onChange={model.change}
                  options={MODEL_OPTIONS}
                  button={{ bordered: false }}
                />
              </PropertyRow>
              <PropertyRow label="可见性">
                {specifiedVisibility ? (
                  <Button bordered={false}>公开 · 指定空间</Button>
                ) : (
                  <Select
                    value={visibility.value}
                    onChange={visibility.change}
                    options={VISIBILITY_OPTIONS}
                    button={{
                      bordered: false,
                    }}
                  />
                )}
              </PropertyRow>
              <PropertyRow label="并发">
                <span className="tabular-nums">{agent.concurrency}</span>
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
