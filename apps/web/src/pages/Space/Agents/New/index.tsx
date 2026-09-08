import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Form, Input, Select, Space } from 'antd';
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
} from '@ant-design/icons';
import { Button, Page } from '@brierb/brier-ui';
import { createAgent, listWorkComputers } from '@/api/generated';
import type { AgentVisibility, PublicScope } from '@/api/generated';
import { useSpace } from '@/context/SpaceContext';
import { useRequest } from '@/hooks/useRequest';
import { AvatarUpload } from '@/components/AvatarUpload';
import { RuntimeBadge } from '@/components/RuntimeIcon';
import { AI_RUNTIMES, MODELS } from '@/define';

// 前端可见性选项 → 后端 AgentVisibility / PublicScope
const VISIBILITY_TO_SCOPE: Record<
  string,
  { visibility: AgentVisibility; public_scope?: PublicScope }
> = {
  personal: { visibility: 'private' },
  everyone: { visibility: 'public', public_scope: 'all' },
  joined_spaces: { visibility: 'public', public_scope: 'joined_spaces' },
  specified_spaces: { visibility: 'public', public_scope: 'specified_spaces' },
};

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

const SectionCard = ({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <div className="mb-6">
      <div className="mb-3 text-standard font-bold">{title}</div>
      <div className="rounded-xl border border-ghost bg-white p-5">{children}</div>
    </div>
  );
};

const NewAgentContent = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { currentSpaceId } = useSpace();
  const [form] = Form.useForm();
  const [selectedComputerId, setSelectedComputerId] = useState<string | undefined>(undefined);
  const [visibility, setVisibility] = useState<string>('personal');
  const [extensions, setExtensions] = useState<MockExtension[]>(DEFAULT_EXTENSIONS);
  const [extSearch, setExtSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: workComputers } = useRequest(listWorkComputers, []);

  const selectedComputer = useMemo(
    () => (workComputers ?? []).find((c) => c.id === selectedComputerId),
    [workComputers, selectedComputerId],
  );

  // runtime 选项以电脑实际上报为准；未上报时用受支持注册表兜底
  const runtimeOptions = useMemo(() => {
    const runtimes = selectedComputer?.runtimes?.length ? selectedComputer.runtimes : AI_RUNTIMES;
    return runtimes.map((r) => ({
      label: <RuntimeBadge name={r} size={12} />,
      value: r,
    }));
  }, [selectedComputer?.runtimes]);

  const filteredExtensions = useMemo(
    () => extensions.filter((e) => e.name.toLowerCase().includes(extSearch.toLowerCase())),
    [extensions, extSearch],
  );

  const handleCreate = async () => {
    if (!currentSpaceId) {
      message.warning('请先创建工作空间');
      return;
    }
    try {
      const values = await form.validateFields();
      const scope = VISIBILITY_TO_SCOPE[visibility] ?? { visibility: 'private' as const };
      setSubmitting(true);
      await createAgent(currentSpaceId, {
        name: values.name,
        description: values.desc,
        avatar: values.avatar || null,
        visibility: scope.visibility,
        public_scope: scope.public_scope,
        runtime: values.runtime,
        work_computer_id: values.workComputer ?? null,
      });
      message.success('Agent 创建成功');
      navigate('/space/agents');
    } catch (e) {
      // 校验失败静默；接口错误提示
      if (e instanceof Error) message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveExtension = (id: string) => {
    setExtensions((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <Page
      header={
        <>
          <span className="cursor-pointer" onClick={() => navigate('/space/agents')}>
            Agents
          </span>
          <span className="">/</span>
          <span className="font-medium">新建</span>
        </>
      }
      extra={
        <Space>
          <Button onClick={() => navigate('/space/agents')}>取消</Button>
          <Button type="primary" loading={submitting} onClick={handleCreate}>
            创建
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" className="!mx-auto max-w-[720px] !p-5">
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
              options={(workComputers ?? []).map((c) => ({
                value: c.id,
                label: (
                  <span className="flex items-center gap-2">
                    <DesktopOutlined className="text-standard" />
                    {c.name}
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        c.status === 'online' ? 'bg-[#389e0d]' : 'bg-[#c9cdd4]'
                      }`}
                    />
                    <span className="text-xs">{c.status === 'online' ? '在线' : '离线'}</span>
                  </span>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item name="runtime" label="Runtime">
            <Select
              placeholder={selectedComputer ? undefined : '请先选择工作电脑'}
              disabled={!selectedComputer}
              options={selectedComputer ? runtimeOptions : []}
            />
          </Form.Item>
        </SectionCard>

        {/* 基本信息 */}
        <SectionCard title="基本信息">
          <div className="flex gap-5">
            <Form.Item name="avatar" label="头像" className="!mb-0 shrink-0">
              <AvatarUpload size={80} rounded="full" label="上传头像" />
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
                <div className="mt-1 text-xs">不指定则由 runtime 自己决定</div>
              </Form.Item>
            </div>
          </div>

          <div className="my-4 border-t border-ghost" />

          <Form.Item label="可见性">
            <div className="flex flex-col gap-4">
              {VISIBILITY_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="mb-2 text-xs">{group.label}</div>
                  <div className="flex flex-col gap-2">
                    {group.options.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => setVisibility(opt.value)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                          visibility === opt.value
                            ? 'border-[#1677ff] bg-[#eff8ff]'
                            : 'border-ghost hover:border-ghost'
                        }`}
                      >
                        <span className="shrink-0 text-base">{opt.icon}</span>
                        <div className="flex-1">
                          <div className="text-standard font-medium">{opt.label}</div>
                          <div className="mt-0.5 text-xs">{opt.desc}</div>
                        </div>
                        {visibility === opt.value && (
                          <CheckOutlined className="shrink-0 text-standard text-[#1677ff]" />
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
              指令 <span className="ml-2 text-xs font-normal">可选</span>
            </>
          }
        >
          <p className="mb-3 text-xs">设置 Agent 在所有任务中默认遵守的工作方式</p>
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
            <span className="text-xs">支持 Markdown</span>
            <Button size="small" type="text" icon={<UploadOutlined />}>
              从本机导入指令
            </Button>
          </div>
        </SectionCard>

        {/* 预装扩展 */}
        <SectionCard title="预装扩展">
          <p className="mb-3 text-xs">
            Skill 会在任务创建时写入该 Agent 的工作区目录，本地运行时自动可用。
          </p>
          <div className="mb-3 flex items-center gap-2">
            <Input
              placeholder="搜索已绑定的扩展名"
              prefix={<SearchOutlined className="" />}
              value={extSearch}
              onChange={(e) => setExtSearch(e.target.value)}
              className="!w-[240px]"
            />
            <Button size="small" type="text" icon={<AppstoreOutlined />}>
              发现扩展
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {filteredExtensions.map((ext) => (
              <div
                key={ext.id}
                className="flex items-start gap-3 rounded-lg border border-ghost p-3 transition-colors hover:border-ghost"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#f5f5f5]">
                  <AppstoreOutlined className="text-standard" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-standard font-medium">{ext.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs leading-relaxed">{ext.desc}</div>
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
              <div className="py-8 text-center text-standard">
                {extSearch ? '未找到匹配的扩展' : '暂无预装扩展'}
              </div>
            )}
          </div>
        </SectionCard>
      </Form>
    </Page>
  );
};

export default NewAgentContent;
