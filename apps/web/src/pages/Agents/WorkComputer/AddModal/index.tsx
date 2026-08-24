import { useState } from 'react';
import { App, Button, Collapse } from 'antd';
import type { CollapseProps } from 'antd';
import { CopyOutlined, DownOutlined, RobotOutlined } from '@ant-design/icons';
import { Modal } from '@/components/Modal';

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
        &gt;_&nbsp; 或者手动安装（两条命令）
      </span>
    ),
    children: (
      <div className="flex flex-col gap-3">
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
      <div className="text-xs text-muted leading-relaxed">
        命令本身是安全的。hive CLI 仅用于启动一个本地后台服务，通过加密通道与 Hive
        平台通信，不会开放端口给外部网络。HIVE_TOKEN
        是临时密钥，仅用于身份验证，不涉及你的代码或数据权限。
      </div>
    ),
  },
];

export function AddComputerModal({ open, onClose }: AddComputerModalProps) {
  const { message } = App.useApp();
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
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose}>取消</Button>
        </div>
      }
    >
      {/* 推荐方案 */}
      <div className="border border-[#91caff] rounded-lg bg-[#eff8ff] my-3">
        <div className="flex items-start gap-1.5 border-b border-[#91caff] px-3 py-2.5">
          <RobotOutlined className="text-xs text-[#1677ff] mt-1" />
          <div className="flex-1">
            <span className="text-sm font-medium text-[#1f2329]">让本机 AI 帮你装(推荐)</span>
            <p className="text-[11px] text-[#86909c] leading-relaxed">
              复制这段 Prompt，发送给本机的 Claude Code / Cursor / Codex 等 Agent，它会自行处理 Node
              / npm / hive CLI 安装并启动后台服务。
            </p>
          </div>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopyPrompt}
            style={{ background: '#1677ff', borderColor: '#1677ff', color: '#fff' }}
          >
            复制 Prompt
          </Button>
        </div>

        <div
          className={` flex items-center justify-between px-3 py-1.5 ${showPrompt ? 'border-b border-[#91caff]' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={` text-xs text-[#1677ff] cursor-pointer flex items-center gap-1`}
              onClick={() => setShowPrompt(!showPrompt)}
            >
              <DownOutlined
                className={`text-[10px] transition-transform ${showPrompt ? 'rotate-180' : ''}`}
              />
              {showPrompt ? '收起 Prompt 内容' : '预览 Prompt 内容'}
            </span>
          </div>

          <div className="text-xs text-[#86909c]">包含临时密钥，请勿分享</div>
        </div>

        {/* 展开后的 Prompt 内容 */}
        {showPrompt && (
          <div className=" px-3 py-2">
            <pre className="text-xs text-[#86909c] whitespace-pre-wrap font-mono leading-relaxed m-0">
              {PROMPT_CONTENT}
            </pre>
          </div>
        )}
      </div>

      {/* 手动安装 */}
      <Collapse
        expandIconPlacement="end"
        items={MANUAL_ITEMS}
        classNames={{ root: '!mt-4', body: '!p-3' }}
      />

      {/* FAQ */}
      <Collapse
        expandIconPlacement="end"
        items={FAQ_ITEMS}
        classNames={{ root: '!mt-2', body: '!p-3' }}
      />

      {/* 状态提示 */}
      <div className="flex items-center gap-1.5 mt-4 px-3">
        <span className="w-2 h-2 rounded-full bg-[#1677ff] shrink-0" />
        <span className="text-xs text-[#86909c]">
          等待你的电脑上线（后台服务启动后通常一分钟内自动发现）
        </span>
      </div>
    </Modal>
  );
}
