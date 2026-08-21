import { useMemo, useState } from 'react';
import { App, Button, Checkbox, Drawer, Space } from 'antd';
import {
  ArrowUpOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  DesktopOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { StatusBadge } from '../StatusBadge';
import { Tag } from '@/components/Tag';
import { SectionCard } from './SectionCard';
import { workComputers, backendServices, computerAgents } from '../../data/mockData';

interface WorkComputerDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function WorkComputerDrawer({ open, onClose }: WorkComputerDrawerProps) {
  const { message } = App.useApp();
  const [selectedComputerId, setSelectedComputerId] = useState(1);
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const selectedComputer = useMemo(
    () => workComputers.find((c) => c.id === selectedComputerId) ?? workComputers[0],
    [selectedComputerId],
  );

  const selectedService = useMemo(
    () => backendServices.find((s) => s.computerId === selectedComputerId),
    [selectedComputerId],
  );

  const selectedAgents = useMemo(
    () => computerAgents.filter((a) => a.computerId === selectedComputerId),
    [selectedComputerId],
  );

  const isLatest = selectedService?.version === selectedService?.latestVersion;
  const connectionCommand = `hive-cli connect --host ${selectedComputer.hostname} --port 8090`;

  const allSelected =
    selectedAgents.length > 0 && selectedAgentIds.length === selectedAgents.length;
  const someSelected =
    selectedAgentIds.length > 0 && selectedAgentIds.length < selectedAgents.length;

  const handleSelectComputer = (id: number) => {
    setSelectedComputerId(id);
    setSelectedAgentIds([]);
  };

  const handleAgentSelect = (agentId: number, checked: boolean) => {
    setSelectedAgentIds((prev) =>
      checked ? [...prev, agentId] : prev.filter((id) => id !== agentId),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedAgentIds(checked ? selectedAgents.map((a) => a.id) : []);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  const handleBatchDelete = () => {
    message.success(`已删除 ${selectedAgentIds.length} 个 Agent`);
    setSelectedAgentIds([]);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <Drawer
      title="Agent"
      width={960}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{ body: { padding: 0 } }}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing} />
          <Button type="primary" icon={<PlusOutlined />}>
            添加
          </Button>
        </Space>
      }
    >
      <div className="flex h-full">
        {/* Left panel - computer list */}
        <div className="w-60 shrink-0 border-r border-[#e2e2e2] overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <span className="text-sm font-medium text-muted">我添加的</span>
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
                <DesktopOutlined className="text-base text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{computer.name}</div>
                  <div className="text-xs text-faint">
                    {computer.agentCount} 个 Agent
                  </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#f0f0f0] flex items-center justify-center shrink-0">
              <DesktopOutlined className="text-xl text-ink" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold">{selectedComputer.name}</span>
              <StatusBadge status={selectedComputer.status} />
            </div>
          </div>

          {/* Computer info grid */}
          <div className="grid grid-cols-3 gap-4 mb-5 p-4 bg-[#f8f8f8] rounded-lg">
            <div>
              <div className="text-xs text-faint mb-1">最后心跳</div>
              <div className="text-sm font-medium font-mono">
                {selectedComputer.lastHeartbeat}
              </div>
            </div>
            <div>
              <div className="text-xs text-faint mb-1">电脑名</div>
              <div className="text-sm font-medium font-mono">
                {selectedComputer.hostname}
              </div>
            </div>
            <div>
              <div className="text-xs text-faint mb-1">系统</div>
              <div className="text-sm font-medium">{selectedComputer.os}</div>
            </div>
          </div>

          {/* Section cards */}
          <div className="flex flex-col gap-4">
            {/* 后台服务 */}
            <SectionCard title="后台服务">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-faint mb-1">版本</div>
                  <div className="text-sm font-medium font-mono">
                    {selectedService?.version ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-faint mb-1">最后心跳</div>
                  <div className="text-sm font-medium">
                    {selectedService?.lastHeartbeat ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-faint mb-1">Agents</div>
                  <div className="text-sm font-medium font-mono tabular-nums">
                    {selectedService?.agentCount ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-faint mb-1">Runtime</div>
                  <div className="text-sm font-medium">
                    {selectedService?.runtime ?? '—'}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 后台服务升级 */}
            <SectionCard title="后台服务升级">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-faint">当前版本 </span>
                    <span className="text-sm font-medium font-mono">
                      {selectedService?.version ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-faint">最新版本 </span>
                    <span className="text-sm font-medium font-mono">
                      {selectedService?.latestVersion ?? '—'}
                    </span>
                  </div>
                </div>
                {isLatest ? (
                  <Tag
                    icon={<CheckCircleOutlined />}
                    style={{
                      background: '#389e0d1a',
                      borderColor: '#389e0d33',
                      color: '#389e0d',
                    }}
                  >
                    已是最新版本
                  </Tag>
                ) : (
                  <Button type="primary" size="small" icon={<ArrowUpOutlined />}>
                    升级到 {selectedService?.latestVersion}
                  </Button>
                )}
              </div>
            </SectionCard>

            {/* Agents list */}
            <SectionCard
              title="Agents"
              extra={
                <Space>
                  {selectedAgentIds.length > 0 && (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleBatchDelete}
                    >
                      批量删除 ({selectedAgentIds.length})
                    </Button>
                  )}
                  <Button size="small" type="primary" icon={<PlusOutlined />}>
                    新建
                  </Button>
                </Space>
              }
            >
              <div className="flex flex-col">
                <div className="flex items-center py-2 border-b border-[#f0f0f0]">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  >
                    <span className="text-xs text-faint">全选</span>
                  </Checkbox>
                </div>
                {selectedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 py-2 border-b border-[#f0f0f0] last:border-0"
                  >
                    <Checkbox
                      checked={selectedAgentIds.includes(agent.id)}
                      onChange={(e) => handleAgentSelect(agent.id, e.target.checked)}
                    />
                    <span className="text-sm font-medium flex-1">{agent.name}</span>
                    <StatusBadge status={agent.status} />
                    <span className="text-xs font-mono text-muted">{agent.runtime}</span>
                    <span className="text-xs text-faint w-20 text-right">
                      {agent.lastActive}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* HIVE CLI使用 */}
            <SectionCard title="HIVE CLI使用">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-xs text-faint mb-1">连接命令</div>
                  <div className="flex items-center gap-2 bg-[#f5f5f5] rounded px-3 py-2">
                    <code className="flex-1 text-sm font-mono text-ink">
                      {connectionCommand}
                    </code>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(connectionCommand)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button icon={<StopOutlined />}>停止后台服务</Button>
                  <Button icon={<SyncOutlined />}>重启后台服务</Button>
                </div>
              </div>
            </SectionCard>

            {/* 危险操作 */}
            <SectionCard title="危险操作" variant="danger">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <ExclamationCircleOutlined className="text-danger mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">删除Agent工作电脑</div>
                    <div className="text-xs text-muted mt-1">
                      该Agent工作电脑上还有 {selectedComputer.agentCount} 个
                      Agent，请先归档所有 Agent 再删除。
                    </div>
                  </div>
                </div>
                <Button danger icon={<DeleteOutlined />}>
                  删除Agent工作电脑
                </Button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
