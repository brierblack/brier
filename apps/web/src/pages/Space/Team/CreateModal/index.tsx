import { useState } from 'react';
import { App, Button, Form, Input, Select, Upload } from 'antd';
import {
  CrownOutlined,
  EyeOutlined,
  FormOutlined,
  StarOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { agents } from '../../../../data/mockData';
import { Modal } from '@hiveblack/ui';

interface CreateTeamModalProps {
  open: boolean;
  onCancel: () => void;
}

const VISIBILITY_OPTIONS = [
  { value: 'shared', label: '空间共享', desc: '空间成员可 @ 指派' },
  { value: 'private', label: '仅自己', desc: '仅创建者可见' },
] as const;

const AGENT_OPTIONS = agents.map((a) => ({
  value: a.id,
  label: (
    <span className="flex items-center gap-2">
      <span
        className="flex size-5 items-center justify-center rounded text-xs"
        style={{ backgroundColor: a.color + '1a' }}
      >
        {a.icon}
      </span>
      {a.name}
    </span>
  ),
}));

export const CreateTeamModal = ({ open, onCancel }: CreateTeamModalProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [visibility, setVisibility] = useState<string>('private');
  const [avatarUrl, setAvatarUrl] = useState<string>();

  const teamName = Form.useWatch('name', form);

  const handleCancel = () => {
    form.resetFields();
    setVisibility('private');
    setAvatarUrl(undefined);
    onCancel();
  };

  const handleCreate = () => {
    form.validateFields().then(() => {
      message.success('团队创建成功');
      handleCancel();
    });
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={
        <div className="flex items-center justify-end">
          <Button type="text" onClick={handleCancel}>
            取消
          </Button>
          <Button type="primary" onClick={handleCreate}>
            创建 Agent 团队
          </Button>
        </div>
      }
      title={
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#f5f5f5]">
              <TeamOutlined className="text-base" />
            </div>
            <div>
              <div className="text-base font-semibold">创建 Agent 团队</div>
              <div className="text-xs font-normal">
                选择主 Agent 负责协调任务，再按需加入协作成员。
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex gap-6 pt-2">
        {/* Left column — Avatar */}
        <div className="flex w-44 shrink-0 flex-col items-center gap-2 rounded-lg border border-ghost pt-2">
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              setAvatarUrl(URL.createObjectURL(file));
              return false;
            }}
            accept="image/png,image/jpeg"
          >
            {avatarUrl ? (
              <div className="size-20 cursor-pointer overflow-hidden rounded-full border border-ghost">
                <img src={avatarUrl} alt="avatar" className="size-full object-cover" />
              </div>
            ) : (
              <div className="flex size-20 cursor-pointer items-center justify-center rounded-full border border-dashed border-ghost">
                <StarOutlined className="text-xl" />
              </div>
            )}
          </Upload>
          <div className="text-center text-standard font-medium">{teamName || '未命名团队'}</div>
          <div className="text-xs">PNG/JPG，最大 5MB</div>
          <div className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs">
            {visibility === 'private' ? '仅自己' : '空间共享'}
          </div>
        </div>

        {/* Right column — Form */}
        <Form form={form} layout="vertical" className="flex-1">
          {/* 可见性 */}
          <div className="mb-5">
            <div className="mb-1 flex items-center gap-2">
              <EyeOutlined className="text-standard" />
              <span className="text-standard font-semibold">可见性</span>
            </div>
            <p className="mb-3 text-xs">控制团队是否在 @ 列表和任务分配中可见</p>
            <div className="flex gap-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setVisibility(opt.value)}
                  className={`flex-1 cursor-pointer rounded-lg border p-3 transition-colors ${
                    visibility === opt.value
                      ? 'border-[#1677ff] bg-[#eff8ff]'
                      : 'border-ghost hover:border-ghost'
                  }`}
                >
                  <div className="text-standard font-medium">{opt.label}</div>
                  <div className="mt-0.5 text-xs">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 基础信息 */}
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <FormOutlined className="text-standard" />
              <span className="text-standard font-semibold">基础信息</span>
            </div>
            <Form.Item
              name="name"
              label="名称"
              rules={[{ required: true, message: '请输入团队名称' }]}
            >
              <Input placeholder="例如 前端 Agent 团队" />
            </Form.Item>
            <Form.Item name="desc" label="描述">
              <Input.TextArea placeholder="描述这个团队负责什么" showCount maxLength={1024} />
            </Form.Item>
          </div>

          {/* 主 Agent */}
          <div className="mb-5 rounded-lg border border-ghost p-4">
            <div className="mb-1 flex items-center gap-2">
              <CrownOutlined className="text-standard" />
              <span className="text-standard font-semibold">主 Agent</span>
            </div>
            <p className="mb-3 text-xs">接收分配给团队的任务，并协调其他成员。</p>
            <Form.Item
              noStyle
              name="mainAgent"
              rules={[{ required: true, message: '请选择主 Agent' }]}
            >
              <Select
                placeholder="选择一个主 Agent"
                style={{ width: '100%' }}
                options={AGENT_OPTIONS}
              />
            </Form.Item>
          </div>

          {/* 附加成员 */}
          <div className="rounded-lg border border-ghost p-4">
            <div className="mb-1 flex items-center gap-2">
              <UserAddOutlined className="text-standard" />
              <span className="text-standard font-semibold">附加成员（可选）</span>
            </div>
            <p className="mb-3 text-xs">
              主 Agent 可以委派任务给这些成员，也可以稍后再添加。
            </p>
            <Form.Item noStyle name="members">
              <Select
                placeholder="添加协作 Agent"
                style={{ width: '100%' }}
                options={AGENT_OPTIONS}
                mode="multiple"
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
