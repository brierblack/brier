import { Card, Switch, Tabs, Tag } from 'antd';
import { Page } from '@/components/Page';
import { StatusBadge } from '../../components/StatusBadge';

const MODEL_PROVIDERS = [
  {
    provider: 'OpenAI',
    key: 'sk-••••••••••••abcd',
    models: ['GPT-4o', 'GPT-4o mini'],
    enabled: true,
  },
  {
    provider: 'Anthropic',
    key: 'sk-ant-••••••••efgh',
    models: ['Claude 3.5 Sonnet'],
    enabled: true,
  },
  { provider: 'DeepSeek', key: '未配置', models: ['DeepSeek V3'], enabled: false },
];

const MCP_SERVICES = [
  { name: 'GitHub', endpoint: 'mcp://github.com', status: 'online' as const, tools: 12 },
  { name: 'PostgreSQL', endpoint: 'mcp://db:5432', status: 'online' as const, tools: 8 },
  { name: '飞书', endpoint: 'mcp://feishu.com', status: 'error' as const, tools: 6 },
];

const CONFIG_ROWS = [
  { label: 'SSE 端点', value: '/api/run_sse', accent: true },
  { label: '协议头', value: 'x-adk-ui-transport: protocol_native', accent: true },
  { label: '序列化格式', value: 'JSON', accent: false },
  { label: '心跳间隔', value: '15s', accent: true },
];

export function Config() {
  return (
    <Page title="配置" subtitle="模型、MCP 服务、AG-UI 协议与外观设置">
      <Tabs
        defaultActiveKey="model"
        items={[
          {
            key: 'model',
            label: '模型',
            children: (
              <div className="max-w-[600px]">
                {MODEL_PROVIDERS.map((m) => (
                  <Card
                    key={m.provider}
                    size="small"
                    className="mb-3.5"
                    style={{ background: '#f8fafc', borderRadius: 8 }}
                  >
                    <div className="flex justify-between items-center pb-3 mb-2 border-b border-line">
                      <span className="font-semibold text-[15px]">{m.provider}</span>
                      <Switch defaultChecked={m.enabled} />
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-faint text-[13px]">API Key</span>
                      <span
                        className="font-mono text-xs"
                        style={{ color: m.enabled ? '#00c758' : '#cad5e2' }}
                      >
                        {m.key}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-faint text-[13px]">模型</span>
                      <div className="flex gap-1.5">
                        {m.models.map((model) => (
                          <Tag key={model} color="orange" className="font-mono">
                            {model}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            key: 'mcp',
            label: 'MCP 服务',
            children: (
              <div className="max-w-[600px]">
                {MCP_SERVICES.map((s) => (
                  <Card
                    key={s.name}
                    size="small"
                    className="mb-3.5"
                    style={{
                      background: '#f8fafc',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="font-medium mb-1">{s.name}</div>
                      <div className="font-mono text-xs text-faint">{s.endpoint}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-faint">{s.tools} tools</span>
                      <StatusBadge status={s.status} />
                    </div>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            key: 'agui',
            label: 'AG-UI 协议',
            children: (
              <div className="max-w-[600px]">
                <Card
                  size="small"
                  className="mb-3.5"
                  style={{ background: '#f8fafc', borderRadius: 8 }}
                >
                  <div className="font-semibold mb-4">传输配置</div>
                  {CONFIG_ROWS.map((row, i) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center py-2"
                      style={{
                        borderBottom:
                          i < CONFIG_ROWS.length - 1 ? '1px solid var(--color-canvas)' : 'none',
                      }}
                    >
                      <span className="text-faint text-[13px]">{row.label}</span>
                      <span
                        className="font-mono text-[13px]"
                        style={{ color: row.accent ? '#fe6e00' : '#62748e' }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </Card>
                <div className="px-4 py-3 rounded-md bg-brand/6 border border-brand/[0.12] text-[13px] text-brand">
                  <strong>AG-UI 协议版本: 0.1.0</strong> (adk-ui native subset)
                  <br />
                  支持 16 种事件类型，包括 TEXT_MESSAGE、TOOL_CALL、CUSTOM、ACTIVITY_SNAPSHOT 等
                </div>
              </div>
            ),
          },
          {
            key: 'appearance',
            label: '外观',
            children: (
              <div className="max-w-[600px]">
                <Card size="small" style={{ background: '#f8fafc', borderRadius: 8 }}>
                  <div className="font-semibold mb-4">主题</div>
                  <div className="flex items-center py-2 border-b border-canvas">
                    <div className="flex gap-1">
                      <div className="size-6 rounded bg-white border border-line" />
                      <div className="size-6 rounded bg-brand" />
                      <div className="size-6 rounded bg-success" />
                    </div>
                    <div className="flex-1 ml-3">
                      <div className="font-medium text-[13px]">
                        极简白{' '}
                        <Tag color="success" className="ml-2">
                          当前
                        </Tag>
                      </div>
                      <div className="text-[11px] text-faint">纯白 + 橙色</div>
                    </div>
                  </div>
                  <div className="flex items-center py-2">
                    <div className="flex gap-1">
                      <div className="size-6 rounded bg-[#070b14] border border-line" />
                      <div className="size-6 rounded bg-[#06d4ff]" />
                      <div className="size-6 rounded bg-[#10d98f]" />
                    </div>
                    <div className="flex-1 ml-3">
                      <div className="font-medium text-[13px]">暗夜终端</div>
                      <div className="text-[11px] text-faint">深蓝黑 + 电光青</div>
                    </div>
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </Page>
  );
}
