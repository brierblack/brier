import { Suspense, useMemo, useState, use } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, type MenuProps } from 'antd';
import { Button, Dropdown, Page, Select, Table, Tag } from '@brierb/brier-ui';
import {
  PlusOutlined,
  EllipsisOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { CreateTeamModal } from './CreateModal';
import { listTeams } from '@/api/generated';
import { useWorkspace } from '@/context/WorkspaceContext';
import { MODE_MAP } from '../../../define';
import type { AgentTeam } from '../../../types';

const TEAM_STATUS_MAP: Record<AgentTeam['status'], { label: string; color: string }> = {
  available: { label: '可用', color: '!text-emerald-700 !bg-emerald-500/10' },
  unavailable: { label: '不可用', color: '!text-[#90a1b9] !bg-[#90a1b9]/10' },
};

const actionMenuItems: MenuProps['items'] = [
  { key: 'view', label: '查看详情', icon: <EyeOutlined /> },
  { type: 'divider' },
  { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
];

const TeamsTable = ({ wsId }: { wsId: string }) => {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activitySort, setActivitySort] = useState('recent');

  const teams = use(listTeams(wsId));

  const filteredTeams = useMemo(() => {
    let result = teams;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q),
      );
    }
    if (activitySort === 'oldest') {
      result = [...result].sort(
        (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
      );
    } else {
      result = [...result].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
    }
    return result;
  }, [teams, search, activitySort]);

  const columns: ColumnsType<AgentTeam> = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        render: (_, r) => (
          <div
            className="flex cursor-pointer items-center gap-2.5"
            onClick={() => navigate(`/space/team/${r.id}`)}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-ghost">
              👥
            </div>
            <div>
              <div className="font-medium transition-colors hover:text-brand">{r.name}</div>
              <div className="text-[11px]">{r.description ?? '—'}</div>
            </div>
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: (s: AgentTeam['status']) => {
          const cfg = TEAM_STATUS_MAP[s];
          return cfg ? <Tag className={cfg.color}>{cfg.label}</Tag> : <span>{s}</span>;
        },
      },
      {
        title: '模式',
        dataIndex: 'mode',
        render: (m: AgentTeam['mode']) => {
          const cfg = MODE_MAP[m];
          return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <span>{m}</span>;
        },
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        render: (t: string) => (
          <span className="text-xs font-medium">{new Date(t).toLocaleString()}</span>
        ),
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
                if (key === 'view') navigate(`/space/team/${r.id}`);
              },
            }}
            trigger={['click']}
          >
            <Button
              bordered={false}
              icon={<EllipsisOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        ),
      },
    ],
    [navigate],
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
        <div className="mb-4 flex items-center gap-3">
          <Input
            placeholder="搜索团队名称或描述..."
            prefix={<SearchOutlined />}
            className="!w-[320px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <div className="flex-1" />
          <Select
            button={{}}
            value={activitySort}
            onChange={(v) => setActivitySort(v as string)}
            options={[
              { value: 'recent', label: '最近活跃' },
              { value: 'oldest', label: '最久未活跃' },
            ]}
          />
        </div>

        <Table
          bordered
          columns={columns}
          dataSource={filteredTeams}
          rowKey="id"
          pagination={false}
          size="middle"
          onRow={(r) => ({ onClick: () => navigate(`/space/team/${r.id}`) })}
        />

        <CreateTeamModal open={createOpen} onCancel={() => setCreateOpen(false)} />
      </div>
    </Page>
  );
};

const TeamContent = () => {
  const { currentWsId } = useWorkspace();
  if (!currentWsId) {
    return (
      <Page title="Agent 团队" subtitle="编排多 Agent 协作，实现复杂工作流">
        <div className="flex h-full items-center justify-center text-standard">
          请先创建工作空间
        </div>
      </Page>
    );
  }
  return <TeamsTable wsId={currentWsId} />;
};

const Team = () => {
  return (
    <Suspense
      fallback={
        <Page title="Agent 团队" subtitle="编排多 Agent 协作，实现复杂工作流">
          <div className="flex h-full items-center justify-center text-standard">加载中...</div>
        </Page>
      }
    >
      <TeamContent />
    </Suspense>
  );
};
export default Team;
