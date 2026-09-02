import { useEffect, useState } from 'react';
import { App, Collapse } from 'antd';
import { Button } from '@brierb/brier-ui';
import type { CollapseProps } from 'antd';
import { CopyOutlined, DownOutlined, RobotOutlined, ReloadOutlined } from '@ant-design/icons';
import { Modal } from '@brierb/brier-ui';
import { createConnectToken } from '@/api/generated';
import { buildCliCommands, buildConnectPrompt } from '../commands';

interface AddComputerModalProps {
  open: boolean;
  onClose: () => void;
}

export const AddComputerModal = ({ open, onClose }: AddComputerModalProps) => {
  const { message } = App.useApp();
  const [showPrompt, setShowPrompt] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // 打开 Modal 时获取一次性接入令牌（原文仅返回一次，服务端只存哈希）
  const fetchToken = async () => {
    setLoading(true);
    try {
      const res = await createConnectToken();
      setToken(res.token);
    } catch {
      setToken(undefined);
      message.error('获取接入令牌失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setShowPrompt(false);
      fetchToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const commands = token ? buildCliCommands(token) : undefined;
  const promptContent = token ? buildConnectPrompt(token) : '';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  const manualItems: CollapseProps['items'] = [
    {
      key: 'manual',
      label: (
        <span className="flex items-center gap-1.5 text-standard">
          &gt;_&nbsp; 或者手动安装（两条命令）
        </span>
      ),
      children: (
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1 text-xs">1. 安装 brier CLI</div>
            <div className="rounded bg-[#f5f5f5] px-3 py-2">
              <code className="text-standard">
                {commands?.install ?? 'npm install -g @brierb/brier-cli@latest'}
              </code>
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <div className="text-xs">2. 启动后台服务</div>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={fetchToken}
              >
                刷新密钥
              </Button>
            </div>
            <div className="rounded bg-[#f5f5f5] px-3 py-2">
              {commands ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-standard break-all">{commands.start}</code>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(commands.start)}
                  />
                </div>
              ) : (
                <span className="text-xs text-[#86909c]">
                  {loading ? '正在生成接入令牌...' : '接入令牌获取失败，请点击「刷新密钥」重试'}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
  ];

  const faqItems: CollapseProps['items'] = [
    {
      key: 'faq',
      label: (
        <span className="flex items-center gap-1.5 text-standard">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-ghost" />
          这个命令安全吗？会影响我的网络安全吗？
        </span>
      ),
      children: (
        <div className="text-xs leading-relaxed">
          命令本身是安全的。brier CLI 仅用于启动一个本地后台服务，通过加密通道与 Brier
          平台通信，不会开放端口给外部网络。BRIER_TOKEN
          是临时密钥，仅用于身份验证，不涉及你的代码或数据权限。
        </div>
      ),
    },
  ];

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
              / npm / brier CLI 安装并启动后台服务。
            </p>
          </div>
          <Button
            size="small"
            icon={<CopyOutlined />}
            disabled={!promptContent}
            loading={loading}
            onClick={() => handleCopy(promptContent)}
            className="!border-[#1677ff] !bg-[#1677ff] !text-white"
          >
            复制 Prompt
          </Button>
        </div>

        <div
          className={`flex items-center justify-between px-3 py-1.5 ${showPrompt ? 'border-b border-[#91caff]' : ''}`}
        >
          <span
            className="flex cursor-pointer items-center gap-1 text-xs text-[#1677ff]"
            onClick={() => setShowPrompt(!showPrompt)}
          >
            <DownOutlined
              className={`text-[10px] transition-transform ${showPrompt ? 'rotate-180' : ''}`}
            />
            {showPrompt ? '收起 Prompt 内容' : '预览 Prompt 内容'}
          </span>
          <span className="text-xs text-[#86909c]">包含临时密钥，请勿分享</span>
        </div>

        {showPrompt && (
          <div className="px-3 py-2">
            <pre className="m-0 text-xs leading-relaxed whitespace-pre-wrap text-[#86909c]">
              {promptContent || (loading ? '正在生成接入令牌...' : '接入令牌获取失败')}
            </pre>
          </div>
        )}
      </div>

      {/* 手动安装 */}
      <Collapse
        expandIconPlacement="end"
        items={manualItems}
        classNames={{ root: '!mt-4', body: '!p-3' }}
      />

      {/* FAQ */}
      <Collapse
        expandIconPlacement="end"
        items={faqItems}
        classNames={{ root: '!mt-2', body: '!p-3' }}
      />

      {/* 状态提示 */}
      <div className="mt-4 flex items-center gap-1.5 px-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#1677ff]" />
        <span className="text-xs text-[#86909c]">
          等待你的电脑上线（后台服务启动后通常一分钟内自动发现；新密钥会断开旧连接）
        </span>
      </div>
    </Modal>
  );
};
