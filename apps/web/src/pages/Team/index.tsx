import { useMemo } from 'react';
import { App, Button, Dropdown, type MenuProps } from 'antd';
import {
  PlusOutlined,
  EllipsisOutlined,
  EyeOutlined,
  DesktopOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Page } from '@/components/Page';
import { Table } from '@/components/Table';
import { StatusBadge } from '../../components/StatusBadge';
import { teams } from '../../data/mockData';
import type { Team } from '../../types';

const actionMenuItems: MenuProps['items'] = [
  { key: 'view', label: '查看详情', icon: <EyeOutlined /> },
  { key: 'computer', label: '查看工作电脑', icon: <DesktopOutlined /> },
  { key: 'main-agent', label: '查看主 Agent', icon: <UserOutlined /> },
  { type: 'divider' },
  { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
];

export function Team() {
  const { message } = App.useApp();

  const columns: ColumnsType<Team> = useMemo(
    () => [
      {
        title: '名称',
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
        title: '状态',
        dataIndex: 'status',
        render: (s) => <StatusBadge status={s} />,
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
        title: '创建者',
        dataIndex: 'creator',
        render: (c: string) => <span className="text-sm font-medium">{c}</span>,
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
        render: () => (
          <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
            <Button type="text" icon={<EllipsisOutlined />} className="!p-1" />
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => message.info('团队编排器开发中')}
        >
          新建团队
        </Button>
      }
    >
      <Table
        bordered
        columns={columns}
        dataSource={teams}
        rowKey="id"
        pagination={false}
        size="middle"
      />
    </Page>
  );
}
