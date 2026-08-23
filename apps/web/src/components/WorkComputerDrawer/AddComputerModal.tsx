import { useState } from 'react';
import { App, Button, Modal, Collapse, Typography } from 'antd';
import type { CollapseProps } from 'antd';
import {
  CheckOutlined,
  CloudOutlined,
  CopyOutlined,
  DesktopOutlined,
  DownOutlined,
  RightOutlined,
  StarFilled,
} from '@ant-design/icons';

const { Text } = Typography;

interface AddComputerModalProps {
  open: boolean;
  onClose: () => void;
}

const PROMPT_CONTENT = `请帮我在本机接入 Hive 远程编码池，分两步完成：

【1. 安装 hive CLI】
- 先确认 Node.js 已装（无则用 nvm 安装 LTS）
- 执行：npm install -g @hive/cli@latest
- 如 hive 已安装，请升级到 latest

【2. 启动后台服务】
- 执行：HIVE_TOKEN='temp-hive-token-xxxxx' hive daemon start --server-url https://hive.local
- HIVE_TOKEN 是临时密钥（约 30 天有效），请勿写入版本控制或分享
- 如后台服务已在跑，先告诉我状态，不要强行重启
- 执行过程中遇到需要权限或选择的步骤先问我；全部完成后告诉我"后台服务已上线"，我会回到平台页面等待自动发现。（跟我汇报时把 daemon 一律说"后台服务"。）`;

const MANUAL_ITEMS: CollapseProps['items'] = [
  {
    key: 'manual',
    label: (
      <span className="flex items-center gap-1.5 text-sm text-muted">
        <RightOutlined className="text-[10px] text-faint" />
        或者手动安装（两条命令）
      </span>
    ),
    children: (
      <div className="flex flex-col gap-3 pl-5">
        <div>
          <div className="text-xs text-faint mb-1">1. 安装 hive CLI</div>
          <div className="bg-[#f5f5f5] rounded px-3 py-2">
            <code className="text-sm font-mono text-ink">npm install -g @hive/cli@latest</code>
          </div>
        </div>
        <div>
          <div className="text-xs text-faint mb-1">2. 启动后台服务</div>
          <div className="bg-[#f5f5f5] rounded px-3 py-2">
            <code className="text-sm font-mono text-ink break-all">
              HIVE_TOKEN='your-token' hive daemon start --server-url https://hive.local
            </code>
          </div>
        </div>
      </div>
    ),
  },
];

const FAQ_ITEMS: CollapseProps['items'] = [
  {
    key: 'faq',
    label: (
      <span className="flex items-center gap-1.5 text-sm text-muted">
        <span className="w-3.5 h-3.5 rounded-full border border-[#d9d9d9] shrink-0" />
        这个命令安全吗？会影响我的网络安全吗？
      </span>
    ),
    children: (
      <div className="text-xs text-muted leading-relaxed pl-5">
        命令本身是安全的。hive CLI 仅用于启动一个本地后台服务，通过加密通道与 Hive
        平台通信，不会开放端口给外部网络。HIVE_TOKEN
        是临时密钥，仅用于身份验证，不涉及你的代码或数据权限。
      </div>
    ),
  },
];

export function AddComputerModal({ open, onClose }: AddComputerModalProps) {
  const { message } = App.useApp();
  const [selectedType, setSelectedType] = useState<'local' | 'cloud'>('local');
  const [showPrompt, setShowPrompt] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_CONTENT);
    message.success('Prompt 已复制到剪贴板');
  };

  return (
    <Modal
      title="添加 Agent 工作电脑"
      open={open}
      onCancel={onClose}
      width={560}
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose}>取消</Button>
        </div>
      }
    >
      {/* 选项卡区域 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          onClick={() => setSelectedType('local')}
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
            selectedType === 'local'
              ? 'border-[#389e0d] bg-[#f6ffed]'
              : 'border-[#e4e6eb] bg-[#f7f8fa] hover:border-[#d9d9d9]'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 border border-[#e4e6eb]">
            <DesktopOutlined className="text-lg text-[#4e5969]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#1f2329]">你的办公电脑</div>
            <div className="text-xs text-[#86909c]">使用你当前工作电脑上的 Agents</div>
          </div>
          {selectedType === 'local' && (
            <CheckOutlined className="text-[#389e0d] text-sm shrink-0" />
          )}
        </div>

        <div
          onClick={() => setSelectedType('cloud')}
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
            selectedType === 'cloud'
              ? 'border-[#389e0d] bg-[#f6ffed]'
              : 'border-[#e4e6eb] bg-[#f7f8fa] hover:border-[#d9d9d9]'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#fff1f0] flex items-center justify-center shrink-0">
            <CloudOutlined className="text-lg" style={{ color: '#cf1322' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#1f2329]">Poolab 云主机</div>
            <div className="text-xs text-[#86909c]">使用 Poolab 云主机中的 Agents</div>
          </div>
          {selectedType === 'cloud' && (
            <CheckOutlined className="text-[#389e0d] text-sm shrink-0" />
          )}
        </div>
      </div>

      {selectedType === 'local' && (
        <>
          {/* 添加你的办公电脑 */}
          <div className="text-sm font-semibold text-[#1f2329] mb-3">添加你的办公电脑</div>

          {/* 推荐方案 */}
          <div className="border border-[#b7eb8f] rounded-lg bg-[#f6ffed] p-4 mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <StarFilled className="text-xs text-[#389e0d]" />
              <span className="text-sm font-medium text-[#1f2329]">让本机 AI 帮你装(推荐)</span>
            </div>
            <p className="text-xs text-[#86909c] leading-relaxed mb-3">
              复制这段 Prompt，发送给本机的 Claude Code / Cursor / Codex 等 Agent，它会自行处理 Node
              / npm / hive CLI 安装并启动后台服务。
            </p>

            <div className="flex items-center justify-between">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopyPrompt}
                style={{ background: '#389e0d', borderColor: '#389e0d', color: '#fff' }}
              >
                复制 Prompt
              </Button>
              <span
                className="text-xs text-[#389e0d] cursor-pointer flex items-center gap-0.5"
                onClick={() => setShowPrompt(!showPrompt)}
              >
                {showPrompt ? '收起 Prompt 内容' : '预览 Prompt 内容'}
                <DownOutlined
                  className={`text-[10px] transition-transform ${showPrompt ? 'rotate-180' : ''}`}
                />
              </span>
            </div>

            <div className="text-xs text-[#86909c] mt-2">包含临时密钥，请勿分享</div>

            {/* 展开后的 Prompt 内容 */}
            {showPrompt && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-[#d9f7be]">
                <pre className="text-xs text-[#86909c] whitespace-pre-wrap font-mono leading-relaxed m-0">
                  {PROMPT_CONTENT}
                </pre>
              </div>
            )}
          </div>

          {/* 手动安装 */}
          <Collapse items={MANUAL_ITEMS} ghost className="mb-2" style={{ padding: 0 }} />

          {/* FAQ */}
          <Collapse items={FAQ_ITEMS} ghost className="mb-3" style={{ padding: 0 }} />

          {/* 状态提示 */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#389e0d] shrink-0" />
            <span className="text-xs text-[#86909c]">
              等待你的电脑上线（后台服务启动后通常一分钟内自动发现）
            </span>
          </div>
        </>
      )}

      {selectedType === 'cloud' && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CloudOutlined className="text-4xl text-[#c9cdd4] mb-3" />
          <Text className="text-sm text-[#86909c]">Poolab 云主机功能即将上线</Text>
          <Text className="text-xs text-[#c9cdd4] mt-1">敬请期待</Text>
        </div>
      )}
    </Modal>
  );
}
