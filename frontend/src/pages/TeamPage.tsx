import { useMemo } from 'react';
import { Avatar, Button, Table, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageCard } from '../components/PageCard';
import { StatusBadge } from '../components/StatusBadge';
import { teams } from '../data/mockData';
import { MODE_MAP } from '../define';
import type { Team } from '../types';

export function TeamPage() {
  const { message } = App.useApp();

  const columns: ColumnsType<Team> = useMemo(
    () => [
      {
        title: '团队',
        dataIndex: 'name',
        render: (_, r) => (
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-md flex items-center justify-center bg-surface border border-line shrink-0">
              👥
            </div>
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-[11px] text-faint">{r.desc}</div>
            </div>
          </div>
        ),
      },
      {
        title: '编排模式',
        dataIndex: 'mode',
        render: (m: Team['mode']) => {
          const cfg = MODE_MAP[m];
          return <Tag style={{ background: `${cfg.color}0d`, color: cfg.color, border: 'none' }}>{cfg.label}</Tag>;
        },
      },
      {
        title: '成员',
        dataIndex: 'members',
        render: (members: Team['members'], r) => (
          <div className="flex items-center gap-1">
            <Avatar.Group>
              {members.map((m, i) => (
                <Avatar
                  key={i}
                  size={28}
                  style={{ background: `${m.color}0d`, border: `1px solid ${m.color}22`, color: m.color, fontSize: 14, borderRadius: 6 }}
                >
                  {m.icon}
                </Avatar>
              ))}
            </Avatar.Group>
            <span className="text-xs text-faint ml-1.5">{r.agents}</span>
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: (s) => <StatusBadge status={s} />,
      },
      {
        title: '执行次数',
        dataIndex: 'runs',
        render: (r: number) => <span className="font-mono tabular-nums">{r.toLocaleString()}</span>,
      },
    ],
    [],
  );

  return (
    <PageCard
      title="Agent 团队"
      subtitle="编排多 Agent 协作，实现复杂工作流"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('团队编排器开发中')}>
          新建团队
        </Button>
      }
    >
      <Table columns={columns} dataSource={teams} rowKey="id" pagination={false} size="middle" />
    </PageCard>
  );
}
