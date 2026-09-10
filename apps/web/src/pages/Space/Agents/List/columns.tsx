import type { NavigateFunction } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import {
  CopyOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  EyeOutlined,
  GlobalOutlined,
  LockOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, type MenuProps } from '@brierb/brier-ui';
import type { Agent, AgentStatus, AgentVisibility } from '@/api/generated';
import { StatusBadge } from '@/components/StatusBadge';
import { RuntimeBadge } from '@/components/RuntimeIcon';

const actionMenuItems: MenuProps['items'] = [
  { key: 'view', label: '查看详情', icon: <EyeOutlined /> },
  { type: 'divider' },
  { key: 'default', label: '设为默认', icon: <StarOutlined /> },
  { key: 'copy', label: '复制 Agent', icon: <CopyOutlined /> },
  { type: 'divider' },
  { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
];

export interface AgentColumnsProps {
  navigate: NavigateFunction;
  handleDelete: (agent: Agent) => void;
}

export const getColumns: (props: AgentColumnsProps) => ColumnsType<Agent> = (props) => {
  const { navigate, handleDelete } = props;
  return [
    {
      title: '名称',
      dataIndex: 'name',
      render: (_, record) => (
        <div
          className="flex cursor-pointer items-center gap-2.5"
          onClick={() => navigate(`/space/agents/${record.id}`)}
        >
          <Avatar src={record.avatar} shape="square" size={36} />
          <div>
            <div className="font-medium transition-colors hover:text-brand">{record.name}</div>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (text: AgentStatus) => <StatusBadge status={text} />,
    },
    {
      title: '可见性',
      dataIndex: 'visibility',
      render: (text: AgentVisibility) => {
        const config: Record<AgentVisibility, { icon: React.ReactNode; label: string }> = {
          private: { icon: <LockOutlined />, label: '仅个人可用' },
          public_all: { icon: <GlobalOutlined />, label: '公开 · 所有人' },
          public_joined_spaces: { icon: <GlobalOutlined />, label: '公开 · 我加入的所有空间' },
          public_specified_spaces: { icon: <GlobalOutlined />, label: '公开 · 指定空间' },
        };
        const c = config[text] ?? config.private;
        return (
          <span className="flex items-center gap-1 text-xs font-medium">
            {c.icon}
            {c.label}
          </span>
        );
      },
    },
    {
      title: 'Runtime',
      dataIndex: 'runtime',
      render: (text: string | null) =>
        text ? (
          <span className="text-xs font-medium">
            <RuntimeBadge name={text} />
          </span>
        ) : (
          <span className="text-xs text-[#90a1b9]">—</span>
        ),
    },
    {
      title: '最近活跃',
      dataIndex: 'last_active',
      render: (text) => <span className="text-xs font-medium">{text || '—'}</span>,
    },
    {
      title: '操作',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: actionMenuItems,
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();

              if (key === 'view') navigate(`/space/agents/${record.id}`);
              if (key === 'delete') handleDelete(record);
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
  ];
};
