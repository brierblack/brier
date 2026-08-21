import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Steps, Form, Input, Upload, Select, Divider, Switch, type UploadProps } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, PullRequestOutlined, BugOutlined, CheckOutlined } from '@ant-design/icons';

const STEPS = [{ title: '基础信息' }, { title: '指令' }, { title: '自动化' }];

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

const normFile = (e: { fileList?: unknown[] } | unknown[]) => {
  if (Array.isArray(e)) return e;
  return (e as { fileList?: unknown[] })?.fileList;
};

export const CreateSpace = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const handleBack = () => navigate(-1);

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleInsertTemplate = () => {
    form.setFieldValue('instructions', INSTRUCTION_TEMPLATE);
  };

  const handleNext = async () => {
    try {
      await form.validateFields();
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch {
      // validation error — Ant Design displays field messages automatically
    }
  };

  const uploadProps: UploadProps = {
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => setAvatarUrl(e.target?.result as string);
      reader.readAsDataURL(file);
      return false;
    },
  };

  return (
    <div className="h-screen bg-[#fbfbfb] flex flex-col">
      {/* Header: back button (left) + centered title */}
      <div className="shrink-0 px-6 py-4">
        <div className="flex items-center">
          <div className="flex-1">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回
            </Button>
          </div>
          <div className="text-center">
            <h1 className="m-0 text-lg font-bold tracking-tight text-ink">新建空间</h1>
          </div>
          <div className="flex-1" />
        </div>
        <p className="text-center text-xs text-faint mt-1">
          协作空间，承载团队协作所需的全部上下文
        </p>
      </div>

      <Divider className="!m-0" />

      {/* Horizontal timeline */}
      <div className="shrink-0 px-16 py-6 flex justify-center">
        <Steps current={currentStep} items={STEPS} size="small"  className={"w-75"} responsive={false}/>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-auto px-8 pb-6">
        <div className="max-w-[720px] mx-auto">
          <Form form={form} layout="vertical" requiredMark>
            {currentStep === 0 && (
            <>
            <p className="text-sm text-muted mb-6">完善空间基础信息</p>

            {/* Avatar + Name (required, same row) */}
            <Form.Item label="空间头像和名称" required>
              <div className="flex items-center gap-4">
                <Form.Item
                  name="avatar"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  noStyle
                  rules={[{ required: true, message: '请上传空间头像' }]}
                >
                  <Upload {...uploadProps} showUploadList={false}>
                    <div className="relative w-8 h-8 rounded border border-dashed border-[#d9d9d9] flex items-center justify-center cursor-pointer overflow-hidden hover:border-brand transition-colors">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <PlusOutlined className="text-sm text-faint" />
                      )}
                    </div>
                  </Upload>
                </Form.Item>
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

            {/* Description */}
            <Form.Item label="描述" name="description">
              <Input.TextArea
                placeholder="描述空间的用途和目标"
                rows={3}
                style={{ resize: 'none' }}
              />
            </Form.Item>

            {/* Identifier (required) with tooltip explanation */}
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

            {/* Bind GitHub repository with tooltip explanation */}
            <Form.Item
              label="绑定 GitHub 仓库"
              tooltip="Agent 会在这些仓库中定位代码、创建分支并提交 MR。"
              name="repositories"
            >
              <Select
                mode="multiple"
                placeholder="选择 GitHub 仓库"
                options={[
                  { value: 'repo1', label: 'user/repo1' },
                  { value: 'repo2', label: 'user/repo2' },
                  { value: 'repo3', label: 'org/repo3' },
                ]}
              />
            </Form.Item>
            </>
            )}

            {currentStep === 1 && (
            <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-ink">指令（可选）</span>
              <Button size="small" onClick={handleInsertTemplate}>
                插入模版
              </Button>
            </div>
            <p className="text-xs text-faint mb-4">为所有在空间内工作的 Agent 提供自定义指令和上下文</p>
            <Form.Item name="instructions">
              <Input.TextArea
                placeholder="模版内容"
                rows={12}
                style={{ resize: 'none' }}
              />
            </Form.Item>
            </>
            )}

            {currentStep === 2 && (
            <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-ink">开启自动化（可选）</span>
            </div>
            <p className="text-xs text-faint mb-4">选择需要的自动化规则，外部事件发生时会自动创建 Agent 事项并交给 Agent。</p>

            <div className="flex flex-col gap-3">
              {/* Card 1: PR auto review */}
              <div className="flex items-start gap-3 p-4 border border-[#e2e2e2] rounded-lg bg-white">
                <div
                  className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
                  style={{ background: '#fe6e000d', border: '1px solid #fe6e0022' }}
                >
                  <PullRequestOutlined className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ink">PR 变更时自动 Review</div>
                  <p className="text-xs text-faint mt-1 leading-relaxed">当代码仓库有 PR 创建或更新时，直接调用 PR 作者的默认 Agent 审查代码并给出评审意见。</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-muted">触发事件：<span className="text-ink">Github · Pull request</span></span>
                    <span className="text-muted">指派给：<span className="text-ink">PR作者 → ta 的默认 Agent</span></span>
                  </div>
                </div>
                <Form.Item name="autoPrReview" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>

              {/* Card 2: Issue auto assign */}
              <div className="flex items-start gap-3 p-4 border border-[#e2e2e2] rounded-lg bg-white">
                <div
                  className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
                  style={{ background: '#8d54ff0d', border: '1px solid #8d54ff22' }}
                >
                  <BugOutlined className="text-iris" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ink">Issue 创建时自动分派</div>
                  <p className="text-xs text-faint mt-1 leading-relaxed">当代码仓库有新 Issue 创建时，自动分析内容并分配给对应负责人的 Agent 处理。</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-muted">触发事件：<span className="text-ink">Github · Issue</span></span>
                    <span className="text-muted">指派给：<span className="text-ink">Issue 负责人 → ta 的默认 Agent</span></span>
                  </div>
                </div>
                <Form.Item name="autoIssueAssign" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>
            </>
            )}
          </Form>
        </div>
      </div>

      {/* Footer: step-dependent action buttons */}
      <div className="shrink-0 px-8 py-4 border-t border-[#e9e9e9] flex justify-end gap-3">
        {currentStep > 0 && (
          <Button onClick={handlePrev}>上一步</Button>
        )}
        {currentStep < STEPS.length - 1 ? (
          <Button type="primary" onClick={handleNext}>
            下一步
          </Button>
        ) : (
          <Button type="primary" icon={<CheckOutlined />} onClick={handleNext}>
            完成创建
          </Button>
        )}
      </div>
    </div>
  );
};
