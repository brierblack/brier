import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Space, Button, Dropdown, type MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DesktopOutlined,
  EllipsisOutlined,
  EyeOutlined,
  StarOutlined,
  CopyOutlined,
  DeleteOutlined,
  LockOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Page } from '@/components/Page';
import { StatusBadge } from '../../components/StatusBadge';
import { WorkComputerDrawer } from './WorkComputer';
import { agents, workComputers } from '../../data/mockData';
import type { Agent, AgentStatus, AgentVisibility, PublicScope } from '../../types';
import { Table } from '@/components/Table';

const actionMenuItems: MenuProps['items'] = [
  { key: 'view', label: '查看详情', icon: <EyeOutlined /> },
  { key: 'computer', label: '查看工作电脑', icon: <DesktopOutlined /> },
  { type: 'divider' },
  { key: 'default', label: '设为默认', icon: <StarOutlined /> },
  { key: 'copy', label: '复制 Agent', icon: <CopyOutlined /> },
  { type: 'divider' },
  { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
];

export const Agents = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [computerDrawerOpen, setComputerDrawerOpen] = useState(false);

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
        title: '名称',
        dataIndex: 'name',
        render: (_, r) => (
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate(`/agents/${r.id}`)}
          >
            <div
              className="size-9 rounded-md flex items-center justify-center text-lg shrink-0"
              style={{ background: `${r.color}0d`, border: `1px solid ${r.color}22` }}
            >
              {r.icon}
            </div>
            <div>
              <div className="font-medium hover:text-brand transition-colors">{r.name}</div>
            </div>
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: (s: AgentStatus) => <StatusBadge status={s} />,
      },
      {
        title: '可见性',
        dataIndex: 'visibility',
        render: (v: AgentVisibility, r: Agent) => {
          if (v === 'private') {
            return (
              <span className="flex items-center gap-1 text-xs font-medium text-muted">
                <LockOutlined />
                仅个人可用
              </span>
            );
          }
          const scopeConfig: Record<PublicScope, string> = {
            all: '所有人',
            joined_spaces: '我加入的所有空间',
            specified_spaces: '指定空间',
          };
          const scope = r.publicScope ?? 'all';
          return (
            <span className="flex items-center gap-1 text-xs font-medium text-muted">
              <GlobalOutlined />
              公开 · {scopeConfig[scope]}
            </span>
          );
        },
      },
      {
        title: '工作电脑',
        dataIndex: 'workComputer',
        render: (w: string) => (
          <span className="font-mono text-xs font-medium text-muted">{w}</span>
        ),
      },
      {
        title: 'Runtime',
        dataIndex: 'runtime',
        render: (r: string) => (
          <span className="font-mono text-xs font-medium text-muted">{r}</span>
        ),
      },
      {
        title: '最近活跃',
        dataIndex: 'lastActive',
        render: (t: string) => <span className="text-xs font-medium text-faint">{t}</span>,
      },
      {
        title: '操作',
        key: 'action',
        align: 'right',
        render: (_, r) => (
          <Dropdown
            menu={{
              items: actionMenuItems,
              onClick: ({ key }) => {
                if (key === 'view') navigate(`/agents/${r.id}`);
              },
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<EllipsisOutlined />}
              className="!p-1"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        ),
      },
    ],
    [],
  );

  return (
    <Page
      title="Agents"
      subtitle="管理所有 AI Agent，配置模型、技能与工具"
      extra={
        <div className="flex items-center gap-3">
          <Button icon={<ReloadOutlined />}>刷新</Button>
          <Button icon={<DesktopOutlined />} onClick={() => setComputerDrawerOpen(true)}>
            工作电脑 <span className="font-mono tabular-nums">{workComputers.length}</span>
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/agents/new')}>
            新增 Agent
          </Button>
        </div>
      }
    >
      <div className='p-5'>

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
            { value: 'connecting', label: '连接中' },
            { value: 'offline', label: '离线' },
          ]}
        />
      </Space>

      <Table
        bordered
        columns={columns}
        dataSource={filteredAgents}
        rowKey="id"
        pagination={false}
        onRow={(r) => ({ onClick: () => navigate(`/agents/${r.id}`) })}
      />
            </div>

      <WorkComputerDrawer open={computerDrawerOpen} onClose={() => setComputerDrawerOpen(false)} />
    </Page>
  );
};
