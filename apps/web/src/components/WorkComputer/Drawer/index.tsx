import { useMemo, useState } from 'react';
import { App, Space } from 'antd';
import { Button } from '@brierb/brier-ui';
import { DesktopOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Drawer } from '@brierb/brier-ui';
import { backendServices, computerAgents, workComputers } from '@/data/mockData';
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

export const WorkComputerDrawer = ({ open, onClose }: WorkComputerDrawerProps) => {
  const { message } = App.useApp();
  const [selectedComputerId, setSelectedComputerId] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const selectedComputer = useMemo(
    () => workComputers.find((c) => c.id === selectedComputerId) ?? workComputers[0],
    [selectedComputerId],
  );

  const selectedService = useMemo(
    () => backendServices.find((s) => s.computerId === selectedComputerId),
    [selectedComputerId],
  );

  const isLatest = selectedService?.version === selectedService?.latestVersion;

  const selectedAgents = useMemo(
    () => computerAgents.filter((a) => a.computerId === selectedComputerId),
    [selectedComputerId],
  );

  const commands = useMemo(
    () => ({
      install: 'npm install -g @brierb/brier-cli@latest',
      start: `BRIER_TOKEN='${selectedComputer.hostname}-token' brier daemon start --server-url https://brier.local`,
      stop: 'brier daemon stop',
      restart: 'brier daemon restart',
    }),
    [selectedComputer.hostname],
  );

  const handleSelectComputer = (id: number) => {
    setSelectedComputerId(id);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      message.success('已刷新');
    }, 1000);
  };

  const handleDelete = () => {
    message.warning('请先归档所有 Agent 再删除');
  };

  return (
    <Drawer
      title="Agent 工作电脑"
      size={960}
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
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
      <div className="flex h-full">
        {/* Left panel - computer list */}
        <div className="w-80 shrink-0 overflow-y-auto border-r border-ghost p-2">
          <div className="px-2 py-1">
            <span className="text-standard font-medium">我添加的</span>
          </div>
          <div className="flex flex-col gap-1">
            {workComputers.map((computer) => (
              <div
                key={computer.id}
                onClick={() => handleSelectComputer(computer.id)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors ${
                  computer.id === selectedComputerId ? 'bg-[#eaeaea]' : 'hover:bg-[#eaeaea]'
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
                  <div className="text-xs">v2.0.75 · {computer.agentCount} 个 Agent</div>
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
                  <span className="text-xs">最后心跳: {selectedComputer.lastHeartbeat}</span>
                </div>
                <div className="mb-5 font-mono text-standard">
                  {selectedComputer.hostname}, {selectedComputer.systemType}
                </div>
              </div>
            </div>
          </div>

          {/* Section cards */}
          <div className="flex flex-col gap-4">
            <ServiceUpgradeCard
              version={selectedService?.version}
              latestVersion={selectedService?.latestVersion}
              isLatest={isLatest}
            />

            <RuntimeCard runtimes={selectedComputer.detectedRuntimes} />

            <AgentListCard agents={selectedAgents} />

            <CliUsageCard commands={commands} />

            <DangerZoneCard agentCount={selectedComputer.agentCount} onDelete={handleDelete} />
          </div>
        </div>
      </div>
      <AddComputerModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </Drawer>
  );
};
