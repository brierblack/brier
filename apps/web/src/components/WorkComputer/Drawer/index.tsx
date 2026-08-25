import { useMemo, useState } from 'react';
import { App, Button, Space } from 'antd';
import { DesktopOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Drawer } from '@hiveblack/ui';
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
      install: 'npm install -g @hive/cli@latest',
      start: `HIVE_TOKEN='${selectedComputer.hostname}-token' hive daemon start --server-url https://hive.local`,
      stop: 'hive daemon stop',
      restart: 'hive daemon restart',
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
        <div className="w-80 shrink-0 border-r border-line overflow-y-auto">
          <div className="p-2">
            <span className="text-standard font-medium text-muted">我添加的</span>
          </div>
          <div className="px-2 pb-4 flex flex-col gap-0.5">
            {workComputers.map((computer) => (
              <div
                key={computer.id}
                onClick={() => handleSelectComputer(computer.id)}
                className={`flex items-center gap-2.5 px-2 py-2 rounded cursor-pointer transition-colors ${
                  computer.id === selectedComputerId ? 'bg-[#f0f0f0]' : 'hover:bg-[#f5f5f5]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#f0f0f0] flex items-center justify-center shrink-0">
                  <DesktopOutlined className="text-base text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-standard font-medium truncate">{computer.name}</div>
                  <div className="text-xs text-faint">{computer.agentCount} 个 Agent</div>
                </div>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: computer.status === 'online' ? '#389e0d' : '#90a1b9',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - computer detail */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Computer header */}
          <div className="flex flex-col gap-3 mb-1">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f0f0f0] flex items-center justify-center shrink-0">
                <DesktopOutlined className="text-xl text-ink" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-semibold">{selectedComputer.name}</span>
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedComputer.status} />
                  <span className="text-xs text-faint">
                    最后心跳: {selectedComputer.lastHeartbeat}
                  </span>
                </div>
                <div className="text-standard text-muted mb-5 font-mono">
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
