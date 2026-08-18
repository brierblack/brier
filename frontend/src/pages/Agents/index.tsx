import { useMemo, useState } from 'react';
import { Input, Select, Space, Table, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Page } from '@/components/Page';
import { StatusBadge } from '../../components/StatusBadge';
import { useUI } from '../../ui-context';
import { agents } from '../../data/mockData';
import type { Agent, AgentStatus } from '../../types';
import { Button } from '@/components/Button';

export const Agents = () => {
  const { openDrawer } = useUI();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAgents = useMemo(
    () =>
      agents.filter((a) => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [search, statusFilter],
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
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-[11px] text-faint">{r.desc}</div>
            </div>
          </div>
        ),
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
        title: '团队',
        dataIndex: 'team',
        render: (t: string | null) => t ?? <span className="text-ghost">—</span>,
      },
      {
        title: '工作空间',
        dataIndex: 'workspace',
        render: (w: string) => <span className="text-muted">{w}</span>,
      },
      {
        title: '技能',
        dataIndex: 'skills',
        render: (s: number) => <span className="font-mono tabular-nums text-brand">{s}</span>,
      },
      {
        title: '调用',
        dataIndex: 'runs',
        render: (r: number) => (
          <span className="font-mono tabular-nums text-faint">{r.toLocaleString()}</span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: (s: AgentStatus) => <StatusBadge status={s} />,
      },
    ],
    [],
  );

  return (
    <Page
      title="Agents"
      subtitle="管理所有 AI Agent，配置模型、技能与工具"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openDrawer}
        >
          新增 Agent
        </Button>
      }
    >
      <Space className="mb-4">
        <Input
          placeholder="搜索 Agent 名称..."
          prefix={<SearchOutlined />}
          style={{ width: 320 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部状态' },
            { value: 'online', label: '在线' },
            { value: 'busy', label: '忙碌' },
            { value: 'idle', label: '空闲' },
            { value: 'error', label: '异常' },
          ]}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={filteredAgents}
        rowKey="id"
        pagination={false}
        size="middle"
        bordered
      />
    </Page>
  );
};
