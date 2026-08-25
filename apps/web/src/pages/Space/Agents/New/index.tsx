import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Form, Input, Select, Space, Upload } from 'antd';
import {
  CheckOutlined,
  DesktopOutlined,
  LockOutlined,
  GlobalOutlined,
  TeamOutlined,
  BankOutlined,
  DeleteOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UploadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Page } from '@/components/Page';
import { workComputers } from '../../../../data/mockData';
import { MODELS } from '../../../../define';

interface MockExtension {
  id: string;
  name: string;
  desc: string;
}

const DEFAULT_EXTENSIONS: MockExtension[] = [
  {
    id: 'weavefox-studio',
    name: 'weavefox-studio',
    desc: 'WeaveFox Studio 统一入口技能。用于 Studio CLI 相关任务：Issue、部署、远程编码、团队空间、本地 daemon。按用户意图读取 references 中对应能力文档，只加载匹配的子能力，避免一次性加载全部。',
  },
  {
    id: 'antlogs-cli',
    name: 'antlogs-cli',
    desc: '使用 antlogs-cli 命令行工具操作蚂蚁日志平台 (AntLogs/SLS)。支持查询日志、管理 Project/Logstore/应用采集、配置索引、查看权限、管理同步任务等。',
  },
  {
    id: 'dima-cli-skill',
    name: 'Dima-cli-skill',
    desc: 'Dima CLI 技能包，用于数据智能平台操作，包括数据源管理、任务编排和监控告警。',
  },
];

const VISIBILITY_GROUPS = [
  {
    label: '私有',
    options: [{ value: 'personal', icon: <LockOutlined />, label: '个人', desc: '仅自己可用' }],
  },
  {
    label: '公开',
    options: [
      {
        value: 'everyone',
        icon: <GlobalOutlined />,
        label: '所有人（仅白名单）',
        desc: '任何用户可指派/对话',
      },
      {
        value: 'joined_spaces',
        icon: <TeamOutlined />,
        label: '我加入的所有空间',
        desc: '我所在空间的成员可用（加入新空间自动生效）',
      },
      {
        value: 'specified_spaces',
        icon: <BankOutlined />,
        label: '指定空间',
        desc: '仅选定空间的成员可用',
      },
    ],
  },
] as const;

function SectionCard({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-sm font-bold text-ink mb-3">{title}</div>
      <div className="rounded-xl border border-line p-5 bg-white">{children}</div>
    </div>
  );
}

export default function NewAgent() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedComputerId, setSelectedComputerId] = useState<number | undefined>(undefined);
  const [visibility, setVisibility] = useState<string>('personal');
  const [extensions, setExtensions] = useState<MockExtension[]>(DEFAULT_EXTENSIONS);
  const [extSearch, setExtSearch] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const selectedComputer = useMemo(
    () => workComputers.find((c) => c.id === selectedComputerId),
    [selectedComputerId],
  );

  const filteredExtensions = useMemo(
    () => extensions.filter((e) => e.name.toLowerCase().includes(extSearch.toLowerCase())),
    [extensions, extSearch],
  );

  const handleCreate = () => {
    form.validateFields().then(() => {
      message.success('Agent 创建成功');
      navigate('/agents');
    });
  };

  const handleRemoveExtension = (id: string) => {
    setExtensions((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <Page
      breadcrumb={
        <>
          <span
            className="text-muted cursor-pointer hover:text-ink"
            onClick={() => navigate('/agents')}
          >
            Agents
          </span>
          <span className="text-faint">/</span>
          <span className="text-ink font-medium">新建</span>
        </>
      }
      extra={
        <Space>
          <Button onClick={() => navigate('/agents')}>取消</Button>
          <Button type="primary" onClick={handleCreate}>
            创建
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" className="max-w-[720px] !mx-auto !p-5">
        {/* 运行环境 */}
        <SectionCard title="运行环境">
          <Form.Item
            name="workComputer"
            label="Agent 工作电脑"
            rules={[{ required: true, message: '请选择工作电脑' }]}
          >
            <Select
              placeholder="请选择"
              onChange={(val) => setSelectedComputerId(val)}
              options={workComputers.map((c) => ({
                value: c.id,
                label: (
                  <span className="flex items-center gap-2">
                    <DesktopOutlined className="text-sm text-muted" />
                    {c.name}
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        c.status === 'online' ? 'bg-[#389e0d]' : 'bg-[#c9cdd4]'
                      }`}
                    />
                    <span className="text-xs text-faint">
                      {c.status === 'online' ? '在线' : '离线'}
                    </span>
                  </span>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item name="runtime" label="Runtime">
            <Select
              placeholder={selectedComputer ? undefined : '请先选择工作电脑'}
              disabled={!selectedComputer}
              options={
                selectedComputer
                  ? selectedComputer.detectedRuntimes.map((r) => ({
                      label: r,
                      value: r,
                    }))
                  : []
              }
            />
          </Form.Item>
        </SectionCard>

        {/* 基本信息 */}
        <SectionCard title="基本信息">
          <div className="flex gap-5">
            <Form.Item label="头像" className="shrink-0" style={{ marginBottom: 0 }}>
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  setAvatarUrl(URL.createObjectURL(file));
                  return false;
                }}
                accept="image/*"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="头像"
                    className="size-20 rounded-full object-cover cursor-pointer"
                  />
                ) : (
                  <div className="size-20 rounded-full border border-dashed border-line flex flex-col items-center justify-center cursor-pointer hover:border-[#1677ff] text-faint">
                    <PlusOutlined className="text-lg" />
                    <span className="text-xs mt-1">上传头像</span>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <div className="flex-1">
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>

              <Form.Item name="desc" label="描述">
                <Input.TextArea rows={2} placeholder="一句话说明这个 agent 负责什么" />
              </Form.Item>

              <Form.Item label="模型">
                <Form.Item name="model" noStyle>
                  <Select
                    placeholder="不指定则由 runtime 自己决定"
                    allowClear
                    options={MODELS.map((m) => ({ label: m, value: m }))}
                  />
                </Form.Item>
                <div className="text-xs text-faint mt-1">不指定则由 runtime 自己决定</div>
              </Form.Item>
            </div>
          </div>

          <div className="border-t border-line my-4" />

          <Form.Item label="可见性">
            <div className="flex flex-col gap-4">
              {VISIBILITY_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="text-xs text-faint mb-2">{group.label}</div>
                  <div className="flex flex-col gap-2">
                    {group.options.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => setVisibility(opt.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                          visibility === opt.value
                            ? 'border-[#1677ff] bg-[#eff8ff]'
                            : 'border-line hover:border-line'
                        }`}
                      >
                        <span className="text-base text-muted shrink-0">{opt.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-ink">{opt.label}</div>
                          <div className="text-xs text-faint mt-0.5">{opt.desc}</div>
                        </div>
                        {visibility === opt.value && (
                          <CheckOutlined className="text-sm text-[#1677ff] shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Form.Item>
        </SectionCard>

        {/* 指令 */}
        <SectionCard
          title={
            <>
              指令 <span className="text-xs font-normal text-faint ml-2">可选</span>
            </>
          }
        >
          <p className="text-xs text-faint mb-3">设置 Agent 在所有任务中默认遵守的工作方式</p>
          <Form.Item name="instructions">
            <Input.TextArea
              rows={6}
              placeholder={`例如：
默认使用中文回复
回复保持简洁，结论优先
修改代码后运行项目检查
在已授权仓库内可以直接完成代码修改`}
            />
          </Form.Item>
          <div className="flex items-center justify-between">
            <span className="text-xs text-faint">支持 Markdown</span>
            <Button size="small" type="text" icon={<UploadOutlined />}>
              从本机导入指令
            </Button>
          </div>
        </SectionCard>

        {/* 预装扩展 */}
        <SectionCard title="预装扩展">
          <p className="text-xs text-faint mb-3">
            Skill 会在任务创建时写入该 Agent 的工作区目录，本地运行时自动可用。
          </p>
          <div className="flex items-center gap-2 mb-3">
            <Input
              placeholder="搜索已绑定的扩展名"
              prefix={<SearchOutlined className="text-faint" />}
              value={extSearch}
              onChange={(e) => setExtSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <Button size="small" type="text" icon={<AppstoreOutlined />}>
              发现扩展
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {filteredExtensions.map((ext) => (
              <div
                key={ext.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-line hover:border-line transition-colors"
              >
                <div className="size-8 rounded-md bg-[#f5f5f5] flex items-center justify-center shrink-0">
                  <AppstoreOutlined className="text-sm text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink">{ext.name}</div>
                  <div className="text-xs text-faint leading-relaxed mt-0.5 line-clamp-2">
                    {ext.desc}
                  </div>
                </div>
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveExtension(ext.id)}
                  className="shrink-0"
                />
              </div>
            ))}
            {filteredExtensions.length === 0 && (
              <div className="text-center py-8 text-sm text-faint">
                {extSearch ? '未找到匹配的扩展' : '暂无预装扩展'}
              </div>
            )}
          </div>
        </SectionCard>
      </Form>
    </Page>
  );
}
