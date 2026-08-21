import { useMemo } from 'react';
import { Button } from 'antd';
import { Tag } from '@/components/Tag';
import { Table } from '@/components/Table';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Page } from '@/components/Page';
import { StatusBadge } from '../../components/StatusBadge';
import { agents, workspaces } from '../../data/mockData';
import type { Agent } from '../../types';

export function Monitor() {
  const stats = useMemo(
    () => [
      { key: 'total', value: agents.length, label: 'Agent 总数', icon: '🤖', color: '#fe6e00' },
      {
        key: 'online',
        value: agents.filter((a) => a.status === 'online').length,
        label: '在线',
        icon: '✅',
        color: '#00c758',
      },
      {
        key: 'runs',
        value: agents.reduce((s, a) => s + a.runs, 0),
        label: '总调用',
        icon: '📊',
        color: '#f99c00',
      },
      {
        key: 'ws',
        value: `${workspaces.filter((w) => w.status === 'online').length}/${workspaces.length}`,
        label: '工作空间',
        icon: '🖥️',
        color: '#8d54ff',
      },
    ],
    [],
  );

  const columns: ColumnsType<Agent> = useMemo(
    () => [
      {
        title: 'Agent',
        dataIndex: 'name',
        render: (_, r) => (
          <div className="flex items-center gap-2.5">
            <div
              className="size-9 rounded-md flex items-center justify-center text-lg shrink-0"
              style={{ background: `${r.color}0d`, border: `1px solid ${r.color}22` }}
            >
              {r.icon}
            </div>
            <span className="font-medium">{r.name}</span>
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: (s) => <StatusBadge status={s} />,
      },
      {
        title: '模型',
        dataIndex: 'model',
        render: (m: string) => (
          <Tag color="orange" className="font-mono">
            {m}
          </Tag>
        ),
      },
      {
        title: '调用次数',
        dataIndex: 'runs',
        render: (r: number) => <span className="font-mono tabular-nums">{r.toLocaleString()}</span>,
      },
      {
        title: '工作空间',
        dataIndex: 'workspace',
        render: (w: string) => <span className="text-muted">{w}</span>,
      },
    ],
    [],
  );

  return (
    <Page
      title="监控"
      subtitle="Agent 运行状态与调用统计"
      extra={<Button icon={<ReloadOutlined />}>刷新</Button>}
    >
      <div className="flex gap-4 mb-6">
        {stats.map((s) => (
          <div
            key={s.key}
            className="flex-1 bg-surface border border-line rounded-md px-4 py-3.5 flex items-center gap-3"
          >
            <div
              className="size-9 rounded-md flex items-center justify-center text-lg shrink-0"
              style={{ background: `${s.color}14` }}
            >
              {s.icon}
            </div>
            <div>
              <div className="font-mono tabular-nums text-[22px] font-bold leading-none">
                {s.value}
              </div>
              <div className="text-[11px] text-faint mt-[3px]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Table
        bordered
        columns={columns}
        dataSource={agents}
        rowKey="id"
        pagination={false}
        size="middle"
      />
    </Page>
  );
}
