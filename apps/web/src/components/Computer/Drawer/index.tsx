import { useMemo, useState } from 'react';
import { App, Space } from 'antd';
import { Button, Drawer } from '@brierb/brier-ui';
import { DesktopOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  createConnectToken,
  deleteWorkComputer,
  listComputerAgents,
  listWorkComputers,
} from '@/api/generated';
import type { ComputerAgent, WorkComputer } from '@/types';
import { useRequest } from '@/hooks/useRequest';
import { useWorkComputerEvents } from '@/hooks/useWorkComputerEvents';
import { StatusBadge } from '@/components/StatusBadge';
import { AddComputerModal } from '../AddModal';
import { buildCliCommands } from '../commands';
import { ServiceUpgradeCard } from './ServiceUpgradeCard';
import { RuntimeCard } from './RuntimeCard';
import { AgentListCard } from './AgentListCard';
import { CliUsageCard } from './CliUsageCard';
import { DangerZoneCard } from './DangerZoneCard';

interface WorkComputerDrawerProps {
  open: boolean;
  onClose: () => void;
}

const DrawerBody = () => {
  const { message, modal } = App.useApp();
  const { data: workComputers, loading, run } = useRequest(listWorkComputers, []);

  const [selectedComputerId, setSelectedComputerId] = useState<string | undefined>();
  const [token, setToken] = useState<string | undefined>(undefined);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedComputer = useMemo(
    () =>
      (workComputers ?? []).find((c) => c.id === selectedComputerId) ?? (workComputers ?? [])[0],
    [workComputers, selectedComputerId],
  );

  // 当前选中电脑上绑定的 Agent（随选中电脑变化重新拉取）
  const { data: agents } = useRequest(listComputerAgents, [selectedComputer?.id]);

  // Agent（领域）→ 卡片展示模型（UI）映射
  const computerAgents = useMemo<ComputerAgent[]>(
    () =>
      (agents ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        desc: a.description ?? '',
        avatar: a.avatar ?? null,
        status: a.status,
        runtime: a.runtime ?? '',
        lastActive: a.last_active ?? '',
        computerId: selectedComputer?.id ?? '',
      })),
    [agents, selectedComputer?.id],
  );

  const commands = useMemo(() => (token ? buildCliCommands(token) : undefined), [token]);

  // 获取/刷新接入令牌（user 级：新令牌会使旧连接失效）
  const handleRefreshToken = async () => {
    setTokenLoading(true);
    try {
      const res = await createConnectToken();
      setToken(res.token);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '获取接入令牌失败');
    } finally {
      setTokenLoading(false);
    }
  };

  // 删除电脑（确认后调 DELETE，成功后本地刷新）
  const handleDelete = (computer: WorkComputer) => {
    modal.confirm({
      title: '删除 Agent 工作电脑',
      content: `确定删除「${computer.name}」吗？该电脑将无法接入平台，关联 Agent 自动解绑。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        setDeleting(true);
        try {
          await deleteWorkComputer(computer.id);
          message.success('已删除');
          if (selectedComputerId === computer.id) setSelectedComputerId(undefined);
          run();
        } catch (e) {
          message.error(e instanceof Error ? e.message : '删除失败');
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  if (!selectedComputer) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted">
        <span>{loading ? '加载中...' : '暂无工作电脑，点击右上角「添加」接入你的电脑'}</span>
        {!loading && !workComputers?.length && (
          <span className="text-xs">接入后约 1 分钟内自动发现</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left panel - computer list */}
      <div className="w-80 shrink-0 overflow-y-auto border-r border-ghost p-2">
        <div className="px-2 py-1">
          <span className="text-standard font-medium">我添加的</span>
        </div>
        <div className="flex flex-col gap-1">
          {workComputers?.map((computer) => (
            <div
              key={computer.id}
              onClick={() => setSelectedComputerId(computer.id)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors ${
                computer.id === selectedComputer.id ? 'bg-[#eaeaea]' : 'hover:bg-[#eaeaea]'
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3f3f3]">
                <DesktopOutlined className="text-base" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="truncate text-standard font-medium">{computer.name}</div>
                  <StatusBadge status={computer.status} />
                </div>
                <div className="text-xs">{computer.os}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - computer detail */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Computer header */}
        <div className="mb-1 flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f0f0]">
              <DesktopOutlined className="text-xl" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">{selectedComputer.name}</span>
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedComputer.status} />
                {selectedComputer.last_seen_at && (
                  <span className="text-xs">
                    最后心跳: {new Date(selectedComputer.last_seen_at).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="mb-5 font-mono text-standard">
                {selectedComputer.host}, {selectedComputer.os}
              </div>
            </div>
          </div>
        </div>

        {/* Section cards */}
        <div className="flex flex-col gap-4">
          <ServiceUpgradeCard version={selectedComputer.version} />

          <RuntimeCard runtimes={selectedComputer.runtimes} />

          <AgentListCard agents={computerAgents} />

          <CliUsageCard
            commands={commands}
            onRefreshToken={handleRefreshToken}
            refreshing={tokenLoading}
          />

          <DangerZoneCard deleting={deleting} onDelete={() => handleDelete(selectedComputer)} />
        </div>
      </div>
    </div>
  );
};

export const ComputerDrawer = ({ open, onClose }: WorkComputerDrawerProps) => {
  const { message } = App.useApp();
  const [, setRefreshTick] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // SSE 事件驱动：电脑上线/下线/删除时刷新一次列表，替代定时轮询
  useWorkComputerEvents(open, () => setRefreshTick((t) => t + 1));

  const handleRefresh = () => {
    setRefreshTick((t) => t + 1);
    message.success('已刷新');
  };

  return (
    <Drawer
      title="Agent 工作电脑"
      size={960}
      open={open}
      onClose={onClose}
      destroyOnHidden
      classNames={{ body: '!p-0' }}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            添加
          </Button>
        </Space>
      }
    >
      {open && <DrawerBody />}
      <AddComputerModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </Drawer>
  );
};
