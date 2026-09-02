import { useMemo, useState } from 'react';
import { App, Space } from 'antd';
import { Button } from '@brierb/brier-ui';
import { DesktopOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Drawer } from '@brierb/brier-ui';
import { listWorkComputers } from '@/api/generated';
import { useApi } from '@/hooks/useApi';
import { StatusBadge } from '@/components/StatusBadge';
import { AddComputerModal } from '../AddModal';
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
  const { data: workComputers } = useApi(listWorkComputers, []);

  const [selectedComputerId, setSelectedComputerId] = useState<string | undefined>();

  const selectedComputer = useMemo(
    () =>
      (workComputers ?? []).find((c) => c.id === selectedComputerId) ?? (workComputers ?? [])[0],
    [workComputers, selectedComputerId],
  );

  const commands = useMemo(
    () => ({
      install: 'npm install -g @brierb/brier-cli@latest',
      start: `BRIER_TOKEN='${selectedComputer?.host ?? ''}-token' brier daemon start --server-url https://brier.local`,
      stop: 'brier daemon stop',
      restart: 'brier daemon restart',
    }),
    [selectedComputer?.host],
  );

  if (!selectedComputer) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        暂无工作电脑，点击右上角「添加」
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
                <span className="text-xs">最后更新: {selectedComputer.updated_at}</span>
              </div>
              <div className="mb-5 font-mono text-standard">
                {selectedComputer.host}, {selectedComputer.os}
              </div>
            </div>
          </div>
        </div>

        {/* Section cards */}
        <div className="flex flex-col gap-4">
          <ServiceUpgradeCard version={undefined} latestVersion={undefined} isLatest={true} />

          <RuntimeCard runtimes={[]} />

          <AgentListCard agents={[]} />

          <CliUsageCard commands={commands} />

          <DangerZoneCard agentCount={0} onDelete={() => {}} />
        </div>
      </div>
    </div>
  );
};

export const WorkComputerDrawer = ({ open, onClose }: WorkComputerDrawerProps) => {
  const { message } = App.useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      message.success('已刷新');
    }, 1000);
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
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing}>
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
