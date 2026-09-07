import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Input } from 'antd';
import { PlusOutlined, ReloadOutlined, DesktopOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Page, Select, Table } from '@brierb/brier-ui';
import { deleteAgent, listAgents, listWorkComputers, type Agent } from '@/api/generated';
import { useRequest } from '@/hooks/useRequest';
import { useSpace } from '@/context/SpaceContext';
import { ComputerDrawer } from '@/components/Computer';
import { getColumns } from './columns';

const List = () => {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { currentSpaceId } = useSpace();

  const [keyword, setKeyword] = useState('');
  const [activitySort, setActivitySort] = useState('recent');
  const [computerDrawerOpen, setComputerDrawerOpen] = useState(false);

  const { data: computers } = useRequest(listWorkComputers, []);
  const { data: agents, run: runAgents, loading } = useRequest(listAgents, [currentSpaceId]);

  const handleComputerDrawerClose = useCallback(() => {
    setComputerDrawerOpen(false);
  }, []);

  /** 删除 Agent：确认后调 DELETE 并从列表移除 */
  const handleDelete = (agent: Agent) => {
    modal.confirm({
      title: `删除 Agent「${agent.name}」`,
      content: '删除后该 Agent 将从空间移除，无法再被指派或下发任务。确定删除吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteAgent(currentSpaceId, agent.id);
          message.success('已删除');
          runAgents(currentSpaceId);
        } catch (e) {
          message.error(e instanceof Error ? e.message : '删除失败');
        }
      },
    });
  };

  const columns = useMemo(() => getColumns({ navigate, handleDelete }), [handleDelete]);
  const rowKey = useMemo(() => (row: Agent) => row.id, []);
  const onRow = useMemo(
    () => (row: Agent) => ({ onClick: () => navigate(`/space/agents/${row.id}`) }),
    [],
  );

  const filteredAgents = useMemo(
    () => agents?.filter((agent) => agent.name.includes(keyword)),
    [agents, keyword],
  );

  return (
    <Page
      title="Agents"
      subtitle="管理所有 AI Agent，配置模型、技能与工具"
      extra={
        <div className="flex items-center gap-3">
          <Button icon={<ReloadOutlined />} onClick={() => runAgents(currentSpaceId)}>
            刷新
          </Button>
          <Button icon={<DesktopOutlined />} onClick={() => setComputerDrawerOpen(true)}>
            工作电脑 <span className="tabular-nums">{computers?.length ?? 0}</span>
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
        <div className="mb-4 flex items-center justify-between">
          <Input
            placeholder="搜索 Agent 名称..."
            prefix={<SearchOutlined />}
            className="w-[320px]!"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
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
          loading={loading}
          columns={columns}
          dataSource={filteredAgents}
          rowKey={rowKey}
          onRow={onRow}
          pagination={false}
        />
      </div>
      <ComputerDrawer open={computerDrawerOpen} onClose={handleComputerDrawerClose} />
    </Page>
  );
};

export default List;
