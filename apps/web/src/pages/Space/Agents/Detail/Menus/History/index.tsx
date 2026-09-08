import { memo } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { MOCK_CONVERSATIONS } from '../config';
import { Table, Tag } from '@brierb/brier-ui';

export const History = memo(() => {
  const columns: ColumnsType<(typeof MOCK_CONVERSATIONS)[0]> = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (t: string) => <span className="font-medium">{t}</span>,
    },
    {
      title: '消息数',
      dataIndex: 'messages',
      render: (n: number) => <span className="font-mono text-xs tabular-nums">{n}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag color={s === '进行中' ? '#1677ff' : '#90a1b9'}>{s}</Tag>,
    },
    {
      title: '最近活跃',
      dataIndex: 'lastActive',
      render: (t: string) => <span className="text-xs">{t}</span>,
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl">
        <div className="mb-3 text-standard font-bold">历史会话</div>
        <Table
          bordered
          columns={columns}
          dataSource={MOCK_CONVERSATIONS}
          rowKey="id"
          pagination={false}
        />
      </div>
    </div>
  );
});
