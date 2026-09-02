import { use, useMemo, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, type MenuProps } from 'antd';
import { Button, Page, Select, Table, Dropdown } from '@brierb/brier-ui';
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
import { StatusBadge } from '../../../components/StatusBadge';
import { RuntimeBadge } from '../../../components/RuntimeIcon';
import { WorkComputerDrawer } from '../../../components/WorkComputer';
import { listAgents, listWorkComputers } from '@/api/generated';
import { useWorkspace } from '@/context/WorkspaceContext';
import type {
  Agent,
  AgentStatus,
  AgentVisibility,
  PublicScope,
  WorkComputer,
} from '../../../types';

const actionMenuItems: MenuProps['items'] = [
  { key: 'view', label: '查看详情', icon: <EyeOutlined /> },
  { key: 'computer', label: '查看工作电脑', icon: <DesktopOutlined /> },
  { type: 'divider' },
  { key: 'default', label: '设为默认', icon: <StarOutlined /> },
  { key: 'copy', label: '复制 Agent', icon: <CopyOutlined /> },
  { type: 'divider' },
  { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
];

const AgentsTable = ({ wsId, workComputers }: { wsId: string; workComputers: WorkComputer[] }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter] = useState<string>('all');
  const [activitySort, setActivitySort] = useState('recent');
  const [computerDrawerOpen, setComputerDrawerOpen] = useState(false);

  const agents = use(listAgents(wsId));

  const filteredAgents = useMemo(
    () =>
      agents.filter((a) => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [agents, search, statusFilter],
  );

  const columns: ColumnsType<Agent> = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        render: (_, r) => (
          <div
            className="flex cursor-pointer items-center gap-2.5"
            onClick={() => navigate(`/space/agents/${r.id}`)}
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-lg"
              style={{
                background: `${r.color ?? '#90a1b9'}0d`,
                border: `1px solid ${r.color ?? '#90a1b9'}22`,
              }}
            >
              {r.icon ?? '🤖'}
            </div>
            <div>
              <div className="font-medium transition-colors hover:text-brand">{r.name}</div>
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
              <span className="flex items-center gap-1 text-xs font-medium">
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
          const scope = r.public_scope ?? 'all';
          return (
            <span className="flex items-center gap-1 text-xs font-medium">
              <GlobalOutlined />
              公开 · {scopeConfig[scope]}
            </span>
          );
        },
      },
      {
        title: 'Runtime',
        dataIndex: 'runtime',
        render: (r: string | null) =>
          r ? (
            <span className="text-xs font-medium">
              <RuntimeBadge name={r} />
            </span>
          ) : (
            <span className="text-xs text-[#90a1b9]">—</span>
          ),
      },
      {
        title: '最近活跃',
        dataIndex: 'last_active',
        render: (t: string | null) => <span className="text-xs font-medium">{t ?? '—'}</span>,
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
                if (key === 'view') navigate(`/space/agents/${r.id}`);
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
            工作电脑 <span className="tabular-nums">{workComputers.length}</span>
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/space/agents/new')}
          >
            新增 Agent
          </Button>
        </div>
      }
    >
      <div className="p-4">
        <div className="mb-4 flex items-center gap-3">
          <Input
            placeholder="搜索 Agent 名称..."
            prefix={<SearchOutlined />}
            className="!w-[320px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          dataSource={filteredAgents}
          rowKey="id"
          pagination={false}
          onRow={(r) => ({ onClick: () => navigate(`/space/agents/${r.id}`) })}
        />
      </div>

      <WorkComputerDrawer open={computerDrawerOpen} onClose={() => setComputerDrawerOpen(false)} />
    </Page>
  );
};

const AgentsContent = () => {
  const { currentWsId } = useWorkspace();
  const workComputers = use(listWorkComputers());
  if (!currentWsId) {
    return <div className="p-4 text-standard">请先创建工作空间</div>;
  }
  return <AgentsTable wsId={currentWsId} workComputers={workComputers} />;
};

const Agents = () => {
  return (
    <Suspense fallback={<div className="p-4 text-standard">加载中...</div>}>
      <AgentsContent />
    </Suspense>
  );
};
export default Agents;
