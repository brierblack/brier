import { useState } from 'react';
import { Button, Checkbox, ColorPicker, Drawer, Form, Input, InputNumber, Select, Slider, Space, Steps, Tag, Typography } from 'antd';
import { CheckOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { skills } from '../data/mockData';
import { MODELS, AGENT_ICONS, TEAMS_LIST, WORKSPACES_LIST, CREATE_STEPS, SKILL_TYPE_MAP } from '../define';

const { Text } = Typography;

interface AddAgentDrawerProps {
  open: boolean;
  onClose: () => void;
}

const SKILL_OPTIONS = skills.map((s) => ({
  label: (
    <span className="inline-flex items-center gap-1.5">
      {s.name}
      <Tag style={{ background: `${SKILL_TYPE_MAP[s.type].color}0d`, color: SKILL_TYPE_MAP[s.type].color, border: 'none', fontSize: 10 }}>
        {SKILL_TYPE_MAP[s.type].label}
      </Tag>
    </span>
  ),
  value: s.name,
}));

const TOOL_OPTIONS = [
  { label: 'Web 搜索', value: 'web_search' },
  { label: '代码执行', value: 'code_exec' },
  { label: '文件读写', value: 'file_io' },
  { label: 'Shell 命令', value: 'shell' },
  { label: 'HTTP 请求', value: 'http' },
  { label: '数据库查询', value: 'db_query' },
  { label: '发送消息', value: 'send_msg' },
  { label: '图像生成', value: 'image_gen' },
];

export function AddAgentDrawer({ open, onClose }: AddAgentDrawerProps) {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const handleReset = () => {
    setCurrent(0);
    form.resetFields();
    setSelectedSkills([]);
    setSelectedTools([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const next = () => setCurrent((c) => Math.min(c + 1, CREATE_STEPS.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  const formValues = form.getFieldsValue(true);
  const summaryItems = [
    { label: '名称', value: formValues.name },
    { label: '描述', value: formValues.desc },
    { label: '图标', value: formValues.icon },
    { label: '模型', value: formValues.model },
    { label: '温度', value: formValues.temperature },
    { label: '最大 Token', value: formValues.maxTokens },
    { label: '工作空间', value: formValues.workspace },
    { label: '团队', value: formValues.team },
    { label: '技能', value: selectedSkills.length ? selectedSkills.join('、') : '未选择' },
    { label: '工具', value: selectedTools.length ? selectedTools.join('、') : '未选择' },
  ];

  return (
    <Drawer
      title="新增 Agent"
      width={520}
      open={open}
      onClose={handleClose}
      destroyOnClose
      extra={
        <Steps
          current={current}
          size="small"
          style={{ maxWidth: 340 }}
          items={CREATE_STEPS.map((s) => ({ title: s }))}
        />
      }
      footer={
        <div className="flex justify-between">
          <Button onClick={handleClose}>取消</Button>
          <Space>
            {current > 0 && (
              <Button icon={<ArrowLeftOutlined />} onClick={prev}>
                上一步
              </Button>
            )}
            {current < CREATE_STEPS.length - 1 ? (
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={next}>
                下一步
              </Button>
            ) : (
              <Button type="primary" icon={<CheckOutlined />} onClick={handleClose}>
                确认创建
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ temperature: 0.7, maxTokens: 4096, icon: '🤖' }}>
        {current === 0 && (
          <>
            <Form.Item name="name" label="Agent 名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="例如：数据分析助手" />
            </Form.Item>
            <Form.Item name="desc" label="描述">
              <Input.TextArea rows={2} placeholder="简要描述 Agent 的职责" />
            </Form.Item>
            <Form.Item name="icon" label="图标">
              <Select options={AGENT_ICONS.map((i) => ({ label: i, value: i }))} />
            </Form.Item>
            <Form.Item name="color" label="主题色">
              <ColorPicker showText format="hex" defaultValue="#fe6e00" />
            </Form.Item>
            <Form.Item name="workspace" label="工作空间">
              <Select options={WORKSPACES_LIST.map((w) => ({ label: w, value: w }))} placeholder="选择运行环境" />
            </Form.Item>
            <Form.Item name="team" label="所属团队">
              <Select
                allowClear
                options={TEAMS_LIST.map((t) => ({ label: t, value: t }))}
                placeholder="可选，不选则独立运行"
              />
            </Form.Item>
          </>
        )}

        {current === 1 && (
          <>
            <Form.Item name="model" label="模型" rules={[{ required: true, message: '请选择模型' }]}>
              <Select options={MODELS.map((m) => ({ label: m, value: m }))} placeholder="选择 LLM" />
            </Form.Item>
            <Form.Item name="temperature" label="Temperature">
              <Slider min={0} max={2} step={0.1} marks={{ 0: '0', 0.7: '0.7', 2: '2' }} />
            </Form.Item>
            <Form.Item name="maxTokens" label="Max Tokens">
              <InputNumber min={256} max={32768} step={256} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        {current === 2 && (
          <div>
            <Text type="secondary" className="block mb-3">
              为 Agent 加载技能，技能决定 Agent 可调用的能力
            </Text>
            <Checkbox.Group
              value={selectedSkills}
              onChange={(vals) => setSelectedSkills(vals as string[])}
              options={SKILL_OPTIONS}
              className="flex flex-col gap-2.5"
            />
          </div>
        )}

        {current === 3 && (
          <div>
            <Text type="secondary" className="block mb-3">
              选择 Agent 可使用的工具
            </Text>
            <Checkbox.Group
              value={selectedTools}
              onChange={(vals) => setSelectedTools(vals as string[])}
              options={TOOL_OPTIONS}
              className="flex flex-col gap-2.5"
            />
          </div>
        )}

        {current === 4 && (
          <div>
            <Text type="secondary" className="block mb-4">
              请确认以下配置信息
            </Text>
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-start py-2.5 border-b border-canvas"
              >
                <Text type="secondary" className="text-[13px]">{item.label}</Text>
                <Text className="text-[13px] max-w-[300px] text-right break-words">
                  {String(item.value ?? '—')}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Form>
    </Drawer>
  );
}
