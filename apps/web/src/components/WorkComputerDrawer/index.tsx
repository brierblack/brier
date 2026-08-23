import { useMemo, useState } from 'react';
import { App, Button, Collapse, Drawer, Space, Alert, Typography } from 'antd';
import type { CollapseProps } from 'antd';
import {
  ArrowUpOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  DesktopOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { StatusBadge } from '../StatusBadge';
import { Tag } from '@/components/Tag';
import { SectionCard } from './SectionCard';
import { AddComputerModal } from './AddComputerModal';
import { workComputers, backendServices, computerAgents } from '../../data/mockData';

const { Link } = Typography;

interface WorkComputerDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function WorkComputerDrawer({ open, onClose }: WorkComputerDrawerProps) {
  const { message } = App.useApp();
  const [selectedComputerId, setSelectedComputerId] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
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

  const installCommand = 'npm install -g @hive/cli@latest';
  const startCommand = `HIVE_TOKEN='${selectedComputer.hostname}-token' hive daemon start --server-url https://hive.local`;
  const stopCommand = 'hive daemon stop';
  const restartCommand = 'hive daemon restart';

  const handleSelectComputer = (id: number) => {
    setSelectedComputerId(id);
    setActiveKeys([]);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      message.success('已刷新');
    }, 1000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  const cliItems: CollapseProps['items'] = [
    {
      key: 'connect',
      label: (
        <div>
          <div className="text-sm font-medium">连接命令</div>
          <div className="text-xs text-faint mt-0.5">
            与"添加我的电脑"使用同一套接入命令，临时密钥过期后可刷新
          </div>
        </div>
      ),
      children: (
        <div className="flex flex-col gap-4">
          {/* Step 1 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-[#f0f0f0] text-xs flex items-center justify-center font-medium">
                1
              </span>
              <span className="text-sm font-medium">安装 Hive CLI</span>
              <Tag
                style={{
                  background: '#f0f0f0',
                  borderColor: '#e0e0e0',
                  color: '#999',
                }}
              >
                已安装过可跳过
              </Tag>
            </div>
            <div className="flex items-center gap-2 bg-[#f5f5f5] rounded px-3 py-2">
              <code className="flex-1 text-sm font-mono text-ink">{installCommand}</code>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(installCommand)}
              />
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-[#f0f0f0] text-xs flex items-center justify-center font-medium">
                2
              </span>
              <span className="text-sm font-medium">启动后台服务</span>
            </div>
            <div className="flex items-center gap-2 bg-[#f5f5f5] rounded px-3 py-2">
              <code className="flex-1 text-sm font-mono text-ink break-all">{startCommand}</code>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(startCommand)}
              />
            </div>
          </div>

          {/* Token alert */}
          <Alert
            type="info"
            showIcon={false}
            message={
              <span className="text-xs text-muted">
                HIVE_TOKEN 为临时密钥，请勿分享，有效期约 30 天。过期或不可用时点{' '}
                <Link onClick={() => handleRefresh()}>刷新</Link> 即可更新。
              </span>
            }
            style={{ padding: '8px 12px' }}
          />
        </div>
      ),
    },
    {
      key: 'stop',
      label: (
        <div>
          <div className="text-sm font-medium">停止后台服务</div>
          <div className="text-xs text-faint mt-0.5">
            暂时不用这台电脑接收任务时，可停止本地后台服务
          </div>
        </div>
      ),
      children: (
        <div className="flex items-center gap-2 bg-[#f5f5f5] rounded px-3 py-2">
          <code className="flex-1 text-sm font-mono text-ink">{stopCommand}</code>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(stopCommand)}
          />
        </div>
      ),
    },
    {
      key: 'restart',
      label: (
        <div>
          <div className="text-sm font-medium">重启后台服务</div>
          <div className="text-xs text-faint mt-0.5">
            升级 CLI，调整配置或连接异常后，可重启本地后台服务
          </div>
        </div>
      ),
      children: (
        <div className="flex items-center gap-2 bg-[#f5f5f5] rounded px-3 py-2">
          <code className="flex-1 text-sm font-mono text-ink">{restartCommand}</code>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(restartCommand)}
          />
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title="Agent 工作电脑"
      width={960}
      open={open}
      onClose={onClose}
      destroyOnClose
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
                <div className="w-8 h-8 rounded-lg bg-[#f0f0f0] flex items-center justify-center shrink-0">
                  <DesktopOutlined className="text-base text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{computer.name}</div>
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
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-[#f0f0f0] flex items-center justify-center shrink-0">
              <DesktopOutlined className="text-xl text-ink" />
            </div>
            <span className="text-base font-semibold">{selectedComputer.name}</span>
            <StatusBadge status={selectedComputer.status} />
            <span className="text-xs text-faint">最后心跳: {selectedComputer.lastHeartbeat}</span>
          </div>

          {/* System info line */}
          <div className="text-sm text-muted mb-5 font-mono pl-[52px]">
            {selectedComputer.hostname}, {selectedComputer.systemType}
          </div>

          {/* Section cards */}
          <div className="flex flex-col gap-4">
            {/* 后台服务 */}
            <SectionCard title="后台服务">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">独立后台服务</span>
                  <StatusBadge status={selectedService?.status ?? 'online'} />
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-faint">版本 </span>
                    <span className="text-sm font-medium font-mono">
                      {selectedService?.version ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-faint">Agents </span>
                    <span className="text-sm font-medium font-mono tabular-nums">
                      {selectedComputer.agentCount}
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 检测到的 Runtime */}
            <SectionCard title="检测到的 Runtime">
              <div className="flex flex-wrap gap-2">
                {selectedComputer.detectedRuntimes.map((rt) => (
                  <Tag
                    key={rt}
                    style={{
                      background: '#f0f0f0',
                      borderColor: '#e0e0e0',
                      color: '#333',
                      cursor: 'pointer',
                    }}
                  >
                    {rt}
                  </Tag>
                ))}
              </div>
            </SectionCard>

            {/* 安全警告 */}
            <Alert
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              message="Claude Code 需要安全验证"
              description="检测到 Claude Code Runtime 未完成安全验证，建议在使用前完成安全配置以避免潜在风险。"
            />

            {/* 后台服务升级 */}
            <SectionCard title="后台服务升级">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-faint">当前版本 </span>
                  <span className="text-sm font-medium font-mono">
                    {selectedService?.version ?? '—'}
                  </span>
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
                    已是最新
                  </Tag>
                ) : (
                  <Button type="primary" size="small" icon={<ArrowUpOutlined />}>
                    升级到 {selectedService?.latestVersion}
                  </Button>
                )}
              </div>
            </SectionCard>

            {/* Agents */}
            <SectionCard title={`Agents (${selectedAgents.length})`}>
              <div className="flex flex-col">
                {selectedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 py-2.5 border-b border-[#f0f0f0] last:border-0 cursor-pointer hover:bg-[#fafafa] -mx-2 px-2 rounded transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-[#f0f0f0] flex items-center justify-center text-lg shrink-0">
                      {agent.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{agent.name}</div>
                      <div className="text-xs text-faint truncate">{agent.desc}</div>
                    </div>
                    <StatusBadge status={agent.status} />
                    <span className="text-xs font-mono text-muted">{agent.runtime}</span>
                    <span className="text-xs text-faint w-20 text-right">{agent.lastActive}</span>
                    <RightOutlined className="text-xs text-faint" />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Hive CLI 使用 */}
            <div>
              <div className="text-sm font-medium mb-3">Hive CLI 使用</div>
              <Collapse
                activeKey={activeKeys}
                onChange={(keys) => setActiveKeys(keys as string[])}
                items={cliItems}
                className="hive-cli-collapse"
                style={{
                  background: '#fff',
                  border: '1px solid #e2e2e2',
                  borderRadius: 8,
                }}
              />
            </div>

            {/* 危险操作 */}
            <SectionCard title="危险操作" variant="danger">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <ExclamationCircleOutlined className="text-danger mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">删除 Agent 工作电脑</div>
                    <div className="text-xs text-muted mt-1">
                      该 Agent 工作电脑上还有 {selectedComputer.agentCount} 个 Agent，请先归档所有
                      Agent 再删除。
                    </div>
                  </div>
                </div>
                <Button danger icon={<DeleteOutlined />}>
                  删除 Agent 工作电脑
                </Button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
      <AddComputerModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </Drawer>
  );
}
