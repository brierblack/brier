import { useState } from 'react';
import { Button, Form, Input, Menu, Select, Switch, Upload } from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  RobotOutlined,
  SearchOutlined,
  LockOutlined,
  ToolOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Page, Tag } from '@hiveblack/ui';
import { skills } from '../../../data/mockData';
import { SKILL_TYPE_MAP } from '../../../define';

const SETTINGS_NAV = [
  { key: 'basic', label: '基础信息', icon: <UserOutlined /> },
  { key: 'agent', label: 'Agent 个性化', icon: <RobotOutlined /> },
];

const INSTRUCTION_TEMPLATE = `# 空间指令

## 角色定义
你是空间中的 AI Agent，负责协助团队完成日常工作。

## 工作规范
- 遵循团队的编码规范和最佳实践
- 提交代码前进行自测和代码审查
- 使用清晰的 commit message
- 保持代码简洁，避免过度设计

## 协作要求
- 主动同步工作进展
- 遇到阻塞及时反馈
- 尊重他人的代码和文档`;

const Settings = () => {
  const [activeKey, setActiveKey] = useState('basic');
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [publicSpace, setPublicSpace] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [enabledSkills, setEnabledSkills] = useState<Record<string, boolean>>(
    Object.fromEntries(skills.map((s) => [s.name, true])),
  );

  const filteredSkills = skills.filter((s) => {
    if (!skillSearch) return true;
    const q = skillSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q);
  });

  const handleInsertTemplate = () => {
    form.setFieldValue('instructions', INSTRUCTION_TEMPLATE);
  };

  return (
    <Page
      breadcrumb={
        <>
          <span className="text-faint">设置</span>
          <span className="text-faint">/</span>
          <span className="font-medium text-ink">
            {SETTINGS_NAV.find((n) => n.key === activeKey)?.label}
          </span>
        </>
      }
      extra={<Button type="primary">保存</Button>}
    >
      <div className="flex gap-6">
        {/* Left sidebar */}
        <div className="w-[250px] shrink-0 border-r border-line px-2 py-3">
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            onClick={({ key }) => setActiveKey(key)}
            items={SETTINGS_NAV}
            style={{ borderInlineEnd: 'none' }}
            classNames={{
              root: ' !border-none !grid !gap-1 !bg-transparent',
              item: ' !px-2 !m-0 !h-8 !leading-8 !text-standard !w-full',
            }}
          />
        </div>

        {/* Right form content */}
        <Form form={form} layout="vertical" className="!mx-auto max-w-[720px] flex-1 !p-6">
          {activeKey === 'basic' && (
            <>
              <Form.Item label="空间头像和名称" required>
                <div className="flex items-center gap-4">
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const reader = new FileReader();
                      reader.onload = (e) => setAvatarUrl(e.target?.result as string);
                      reader.readAsDataURL(file);
                      return false;
                    }}
                  >
                    <div className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded border border-dashed border-line transition-colors hover:border-brand">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        <PlusOutlined className="text-standard text-faint" />
                      )}
                    </div>
                  </Upload>
                  <Form.Item
                    name="name"
                    noStyle
                    rules={[{ required: true, message: '请输入空间名称' }]}
                    className="flex-1"
                  >
                    <Input placeholder="输入空间名称" />
                  </Form.Item>
                </div>
              </Form.Item>

              <Form.Item label="描述" name="description">
                <Input.TextArea placeholder="简单介绍下空间" rows={3} style={{ resize: 'none' }} />
              </Form.Item>

              <Form.Item
                label="标识符"
                required
                tooltip="用于事项编号、URL 和 @提及，如 HIVE-123，仅支持大小写字母和数字。"
                name="identifier"
                rules={[
                  { required: true, message: '请输入标识符' },
                  { pattern: /^[A-Za-z0-9]+$/, message: '仅支持大小写字母和数字' },
                ]}
              >
                <Input placeholder="如 HIVE" />
              </Form.Item>

              <Form.Item
                label="绑定 GitHub 仓库"
                tooltip="Agent 会在这些仓库中定位代码、创建分支并提交 MR。"
                name="repositories"
              >
                <Select
                  mode="multiple"
                  placeholder="选择 GitHub 仓库"
                  options={[
                    { value: 'hive/hive-backend', label: 'hive/hive-backend' },
                    { value: 'hive/hive-frontend', label: 'hive/hive-frontend' },
                    { value: 'hive/hive-infra', label: 'hive/hive-infra' },
                  ]}
                />
              </Form.Item>

              {/* 空间可见性 */}
              <div className="mt-6">
                <div className="mb-1 text-standard font-semibold">空间可见性</div>
                <p className="mb-3 text-xs text-faint">控制非成员能否通过空间链接读取公开内容。</p>
                <div className="flex items-center justify-between rounded-lg border border-line bg-white p-4">
                  <div className="flex-1">
                    <div className="text-standard font-medium text-ink">公开空间</div>
                    <p className="mt-1 text-xs leading-relaxed text-faint">
                      开启后，公司内已登录用户可只读访问；只有空间成员可以创建、评论或修改内容。
                    </p>
                  </div>
                  <Switch checked={publicSpace} onChange={setPublicSpace} />
                </div>
              </div>

              {/* 空间操作 */}
              <div className="mt-6">
                <div className="mb-3 text-standard font-semibold">空间操作</div>
                <div className="overflow-hidden rounded-lg border border-[#ffccc7]">
                  <div className="flex items-center justify-between border-b border-[#ffccc7] p-4">
                    <div className="flex-1">
                      <div className="text-standard font-medium text-ink">转交空间</div>
                      <p className="mt-1 text-xs text-faint">将空间所有权转交给其他人员。</p>
                    </div>
                    <Button type="text" danger>
                      转交空间
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="text-standard font-medium text-ink">删除空间</div>
                      <p className="mt-1 text-xs text-faint">
                        删除后空间内的所有 Agent 事项、会话、配置将永久丢失，且无法恢复。
                      </p>
                    </div>
                    <Button type="text" danger>
                      删除空间
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeKey === 'agent' && (
            <>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-standard font-medium text-ink">空间指令</span>
                <Button size="small" onClick={handleInsertTemplate}>
                  插入模版
                </Button>
              </div>
              <p className="mb-4 text-xs text-faint">
                为所有在空间内工作的 Agent 提供自定义指令和上下文
              </p>
              <Form.Item name="instructions">
                <Input.TextArea
                  placeholder={
                    '默认使用中文回复\n回复保持简洁，结论优先\n修改代码后运行项目检查\n在已授权仓库内可以直接完成代码修改'
                  }
                  rows={12}
                  style={{ resize: 'none' }}
                />
              </Form.Item>

              {/* 安装的 Skills */}
              <div className="mt-8">
                <div className="mb-0.5 text-standard font-semibold text-ink">Skills</div>
                <p className="mb-3 text-xs text-faint">
                  为所有空间内工作的 Agent 统一预装 Skills。
                </p>

                <div className="overflow-hidden rounded-lg border border-line">
                  {/* Tab row + add button */}
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">
                        研发任务 {skills.length}
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-[#f0f0f0] px-3 py-1 text-xs text-faint">
                        <LockOutlined className="text-[10px]" />
                        数字实习生
                        <span className="text-[10px]">暂未开放</span>
                      </div>
                    </div>
                    <Button type="primary" icon={<ThunderboltOutlined />}>
                      添加 Skills
                    </Button>
                  </div>

                  {/* Description */}
                  <p className="px-4 pt-3 pb-2 text-xs text-faint">
                    研发任务启动时会默认加载这里启用的 Skills。
                  </p>

                  {/* Search */}
                  <div className="px-4 pb-3">
                    <Input
                      placeholder="搜索 Skills"
                      prefix={<SearchOutlined className="text-faint" />}
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      allowClear
                    />
                  </div>

                  {/* Skills list */}
                  <div className="divide-y divide-line">
                    {filteredSkills.map((skill) => (
                      <div key={skill.name} className="flex items-center gap-3 bg-white px-4 py-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface">
                          <ToolOutlined className="text-standard text-muted" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-standard font-medium text-ink">
                              {skill.name}
                            </span>
                            <Tag color={SKILL_TYPE_MAP[skill.type].color}>
                              {skill.type === 'builtin'
                                ? 'Plugin 内置'
                                : SKILL_TYPE_MAP[skill.type].label}
                            </Tag>
                          </div>
                          <div className="mt-0.5 text-xs leading-relaxed text-faint">
                            {skill.desc}
                          </div>
                        </div>
                        <Switch
                          size="small"
                          checked={enabledSkills[skill.name] ?? true}
                          onChange={(checked) =>
                            setEnabledSkills((prev) => ({
                              ...prev,
                              [skill.name]: checked,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </Form>
      </div>
    </Page>
  );
};
export default Settings;
