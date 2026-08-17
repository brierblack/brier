import { useMemo } from 'react';
import { Button, Progress, Table, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageCard } from '../components/PageCard';
import { StatusBadge } from '../components/StatusBadge';
import { workspaces } from '../data/mockData';
import { WS_TYPE_MAP } from '../define';
import type { Workspace } from '../types';

export function WorkspacePage() {
  const { message } = App.useApp();

  const columns: ColumnsType<Workspace> = useMemo(
    () => [
      {
        title: '工作空间',
        dataIndex: 'name',
        render: (name: string) => (
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-md flex items-center justify-center text-lg bg-surface border border-line shrink-0">
              🖥️
            </div>
            <span className="font-medium">{name}</span>
          </div>
        ),
      },
      {
        title: '类型',
        dataIndex: 'type',
        render: (t: Workspace['type']) => {
          const cfg = WS_TYPE_MAP[t];
          return (
            <Tag style={{ background: `${cfg.color}0d`, color: cfg.color, border: 'none' }}>
              {cfg.label}
            </Tag>
          );
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: (s) => <StatusBadge status={s} />,
      },
      {
        title: 'Agent',
        dataIndex: 'agents',
        render: (a: number) => <span className="font-mono tabular-nums">{a}</span>,
      },
      {
        title: 'CPU',
        dataIndex: 'cpu',
        render: (cpu: number) => (
          <div className="flex items-center gap-1.5 min-w-[100px]">
            <Progress
              percent={cpu}
              size="small"
              strokeColor={cpu > 80 ? '#fb2c36' : '#fe6e00'}
              style={{ flex: 1 }}
            />
            <span
              className="font-mono tabular-nums text-[11px]"
              style={{ color: cpu > 80 ? '#fb2c36' : '#62748e' }}
            >
              {cpu}%
            </span>
          </div>
        ),
      },
      {
        title: '内存',
        dataIndex: 'mem',
        render: (mem: number) => (
          <div className="flex items-center gap-1.5 min-w-[100px]">
            <Progress
              percent={mem}
              size="small"
              strokeColor={mem > 80 ? '#fb2c36' : '#8d54ff'}
              style={{ flex: 1 }}
            />
            <span
              className="font-mono tabular-nums text-[11px]"
              style={{ color: mem > 80 ? '#fb2c36' : '#62748e' }}
            >
              {mem}%
            </span>
          </div>
        ),
      },
      {
        title: '主机',
        dataIndex: 'host',
        render: (h: string) => <span className="font-mono text-xs text-faint">{h}</span>,
      },
      {
        title: '系统',
        dataIndex: 'os',
        render: (os: string) => <span className="text-faint">{os}</span>,
      },
    ],
    [],
  );

  return (
    <PageCard
      title="工作空间"
      subtitle="连接本地电脑或云主机作为 Agent 运行环境"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => message.info('连接工作空间功能开发中')}
        >
          连接工作空间
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={workspaces}
        rowKey="id"
        pagination={false}
        size="middle"
      />
    </PageCard>
  );
}
