import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, Input, Space, type MenuProps } from 'antd';
import { Button } from '@hiveblack/ui';
import {
  PlusOutlined,
  EllipsisOutlined,
  EyeOutlined,
  DesktopOutlined,
  UserOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Page, Table } from '@hiveblack/ui';
import { StatusBadge } from '../../../components/StatusBadge';
import { CreateTeamModal } from './CreateModal';
import { teams } from '../../../data/mockData';
import type { Team } from '../../../types';

const actionMenuItems: MenuProps['items'] = [
  { key: 'view', label: '查看详情', icon: <EyeOutlined /> },
  { key: 'computer', label: '查看工作电脑', icon: <DesktopOutlined /> },
  { key: 'main-agent', label: '查看主 Agent', icon: <UserOutlined /> },
  { type: 'divider' },
  { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
];

const Team = () => {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTeams = useMemo(() => {
    if (!search) return teams;
    const q = search.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.creator.toLowerCase().includes(q),
    );
  }, [search]);

  const columns: ColumnsType<Team> = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        render: (_, r) => (
          <div
            className="flex cursor-pointer items-center gap-2.5"
            onClick={() => navigate(`/team/${r.id}`)}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-ghost">
              👥
            </div>
            <div>
              <div className="font-medium transition-colors hover:text-brand">{r.name}</div>
              <div className="text-[11px]">{r.desc}</div>
            </div>
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: (s) => <StatusBadge status={s} />,
      },
      {
        title: '工作电脑',
        dataIndex: 'workComputer',
        render: (w: string) => <span className="font-mono text-xs font-medium">{w}</span>,
      },
      {
        title: 'Runtime',
        dataIndex: 'runtime',
        render: (r: string) => <span className="font-mono text-xs font-medium">{r}</span>,
      },
      {
        title: '创建者',
        dataIndex: 'creator',
        render: (c: string) => <span className="text-standard font-medium">{c}</span>,
      },
      {
        title: '最近活跃',
        dataIndex: 'lastActive',
        render: (t: string) => <span className="text-xs font-medium">{t}</span>,
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
                if (key === 'view') navigate(`/team/${r.id}`);
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
      title="Agent 团队"
      subtitle="编排多 Agent 协作，实现复杂工作流"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建团队
        </Button>
      }
    >
      <div className="p-4">
        <Space className="mb-4">
          <Input
            placeholder="搜索团队名称、描述或创建者..."
            prefix={<SearchOutlined />}
            style={{ width: 320 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </Space>

        <Table
          bordered
          columns={columns}
          dataSource={filteredTeams}
          rowKey="id"
          pagination={false}
          size="middle"
          onRow={(r) => ({ onClick: () => navigate(`/team/${r.id}`) })}
        />

        <CreateTeamModal open={createOpen} onCancel={() => setCreateOpen(false)} />
      </div>
    </Page>
  );
};
export default Team;
