import { useState } from 'react';
import { App, Button, Collapse } from 'antd';
import type { CollapseProps } from 'antd';
import { CopyOutlined, DownOutlined, RobotOutlined } from '@ant-design/icons';
import { Modal } from '@hiveblack/ui';

interface AddComputerModalProps {
  open: boolean;
  onClose: () => void;
}

const PROMPT_CONTENT = `请帮我在本机接入 Hive 远程编码池，分两步完成：

【1. 安装 hiveblack CLI】
- 先确认 Node.js 已装（无则用 nvm 安装 LTS）
- 执行：npm install -g @hiveblack/cli@latest
- 如 hiveblack 已安装，请升级到 latest

【2. 启动后台服务】
- 执行：HIVE_TOKEN='temp-hive-token-xxxxx' hiveblack daemon start --server-url https://hive.local
- HIVE_TOKEN 是临时密钥（约 30 天有效），请勿写入版本控制或分享
- 如后台服务已在跑，先告诉我状态，不要强行重启
- 执行过程中遇到需要权限或选择的步骤先问我；全部完成后告诉我"后台服务已上线"，我会回到平台页面等待自动发现。（跟我汇报时把 daemon 一律说"后台服务"。）`;

const MANUAL_ITEMS: CollapseProps['items'] = [
  {
    key: 'manual',
    label: (
      <span className="flex items-center gap-1.5 text-standard text-muted">
        &gt;_&nbsp; 或者手动安装（两条命令）
      </span>
    ),
    children: (
      <div className="flex flex-col gap-3">
        <div>
          <div className="mb-1 text-xs text-faint">1. 安装 hiveblack CLI</div>
          <div className="rounded bg-[#f5f5f5] px-3 py-2">
            <code className="font-mono text-standard text-ink">
              npm install -g @hiveblack/cli@latest
            </code>
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs text-faint">2. 启动后台服务</div>
          <div className="rounded bg-[#f5f5f5] px-3 py-2">
            <code className="font-mono text-standard break-all text-ink">
              HIVE_TOKEN='your-token' hiveblack daemon start --server-url https://hive.local
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
      <span className="flex items-center gap-1.5 text-standard text-muted">
        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-line" />
        这个命令安全吗？会影响我的网络安全吗？
      </span>
    ),
    children: (
      <div className="text-xs leading-relaxed text-muted">
        命令本身是安全的。hiveblack CLI 仅用于启动一个本地后台服务，通过加密通道与 Hive
        平台通信，不会开放端口给外部网络。HIVE_TOKEN
        是临时密钥，仅用于身份验证，不涉及你的代码或数据权限。
      </div>
    ),
  },
];

export const AddComputerModal = ({ open, onClose }: AddComputerModalProps) => {
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
      <div className="my-3 rounded-lg border border-[#91caff] bg-[#eff8ff]">
        <div className="flex items-start gap-1.5 border-b border-[#91caff] px-3 py-2.5">
          <RobotOutlined className="mt-1 text-xs text-[#1677ff]" />
          <div className="flex-1">
            <span className="text-standard font-medium text-[#1f2329]">让本机 AI 帮你装(推荐)</span>
            <p className="text-[11px] leading-relaxed text-[#86909c]">
              复制这段 Prompt，发送给本机的 Claude Code / Cursor / Codex 等 Agent，它会自行处理 Node
              / npm / hiveblack CLI 安装并启动后台服务。
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
          className={`flex items-center justify-between px-3 py-1.5 ${showPrompt ? 'border-b border-[#91caff]' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`flex cursor-pointer items-center gap-1 text-xs text-[#1677ff]`}
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
          <div className="px-3 py-2">
            <pre className="m-0 font-mono text-xs leading-relaxed whitespace-pre-wrap text-[#86909c]">
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
      <div className="mt-4 flex items-center gap-1.5 px-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#1677ff]" />
        <span className="text-xs text-[#86909c]">
          等待你的电脑上线（后台服务启动后通常一分钟内自动发现）
        </span>
      </div>
    </Modal>
  );
};
