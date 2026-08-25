import { memo, useState } from 'react';
import { App, Button, Collapse, Alert, Typography } from 'antd';
import type { CollapseProps } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { Card, Tag } from '@hiveblack/ui';

const { Link } = Typography;

interface CliCommands {
  install: string;
  start: string;
  stop: string;
  restart: string;
}

interface CliUsageCardProps {
  commands: CliCommands;
}

export const CliUsageCard = memo(({ commands }: CliUsageCardProps) => {
  const { message } = App.useApp();
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  const handleRefresh = () => {
    message.success('已刷新');
  };

  const cliItems: CollapseProps['items'] = [
    {
      key: 'connect',
      label: (
        <div>
          <div className="text-standard font-medium">连接命令</div>
          <div className="mt-0.5 text-xs text-faint">
            与"添加我的电脑"使用同一套接入命令，临时密钥过期后可刷新
          </div>
        </div>
      ),
      children: (
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f0f0f0] text-xs font-medium">
                1
              </span>
              <span className="text-standard font-medium">安装 Hive CLI</span>
              <Tag
                style={{
                  background: '#f0f0f0',
                  borderColor: 'var(--color-line)',
                  color: '#999',
                }}
              >
                已安装过可跳过
              </Tag>
            </div>
            <div className="flex items-center gap-2 rounded bg-[#f5f5f5] px-3 py-2">
              <code className="flex-1 font-mono text-standard text-ink">{commands.install}</code>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(commands.install)}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f0f0f0] text-xs font-medium">
                2
              </span>
              <span className="text-standard font-medium">启动后台服务</span>
            </div>
            <div className="flex items-center gap-2 rounded bg-[#f5f5f5] px-3 py-2">
              <code className="flex-1 font-mono text-standard break-all text-ink">
                {commands.start}
              </code>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(commands.start)}
              />
            </div>
          </div>

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
          <div className="text-standard font-medium">停止后台服务</div>
          <div className="mt-0.5 text-xs text-faint">
            暂时不用这台电脑接收任务时，可停止本地后台服务
          </div>
        </div>
      ),
      children: (
        <div className="flex items-center gap-2 rounded bg-[#f5f5f5] px-3 py-2">
          <code className="flex-1 font-mono text-standard text-ink">{commands.stop}</code>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(commands.stop)}
          />
        </div>
      ),
    },
    {
      key: 'restart',
      label: (
        <div>
          <div className="text-standard font-medium">重启后台服务</div>
          <div className="mt-0.5 text-xs text-faint">
            升级 CLI，调整配置或连接异常后，可重启本地后台服务
          </div>
        </div>
      ),
      children: (
        <div className="flex items-center gap-2 rounded bg-[#f5f5f5] px-3 py-2">
          <code className="flex-1 font-mono text-standard text-ink">{commands.restart}</code>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(commands.restart)}
          />
        </div>
      ),
    },
  ];

  return (
    <Card title="Hive CLI 使用">
      <Collapse
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(keys as string[])}
        items={cliItems}
        className="hive-cli-collapse"
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--color-line)',
        }}
      />
    </Card>
  );
});

CliUsageCard.displayName = 'CliUsageCard';
