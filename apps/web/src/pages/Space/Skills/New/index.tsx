import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Radio, Upload, type UploadProps, App } from 'antd';
import { Button } from '@brierb/brier-ui';
import { Page } from '@brierb/brier-ui';
import { InboxOutlined, BulbOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

const CATEGORIES = [
  { label: '未分类', value: '未分类' },
  { label: '工具', value: '工具' },
  { label: '开发', value: '开发' },
  { label: '商业', value: '商业' },
  { label: '设计', value: '设计' },
  { label: '数据/AI', value: '数据/AI' },
  { label: '运维', value: '运维' },
  { label: '测试/安全', value: '测试/安全' },
  { label: '文档', value: '文档' },
  { label: '内容/媒体', value: '内容/媒体' },
  { label: '研究', value: '研究' },
  { label: '数据库', value: '数据库' },
  { label: '生活', value: '生活' },
  { label: '区块链', value: '区块链' },
  { label: '智能', value: '智能' },
];

const IMPORT_TABS = [
  { key: 'zip', label: '上传 ZIP' },
  { key: 'github', label: 'GitHub 导入' },
] as const;

const New = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [importTab, setImportTab] = useState<string>('zip');
  const [category, setCategory] = useState('未分类');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [installForMe, setInstallForMe] = useState(true);
  const [githubUrl, setGithubUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip',
    beforeUpload: () => false,
    onChange(info) {
      if (info.fileList.length > 0) {
        message.success(`${info.file.name} 已选择`);
      }
    },
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      message.success('技能创建成功');
      navigate('/space/skills');
    }, 1200);
  };

  return (
    <Page
      header={
        <div className="flex items-center gap-2 text-standard">
          <button
            onClick={() => navigate('/space/skills')}
            className="flex items-center gap-1 transition-colors"
          >
            <ArrowLeftOutlined className="text-xs" />
            <span>市场</span>
          </button>
          <span className="">/</span>
          <span className="font-medium">新建</span>
        </div>
      }
      extra={
        <div className="flex items-center gap-3">
          <span className="text-xs">创建类型</span>
          <Select
            defaultValue="skill"
            className="!w-[120px]"
            options={[
              { label: 'Skill', value: 'skill' },
              { label: 'Plugin', value: 'plugin', disabled: true },
              { label: 'Command', value: 'command', disabled: true },
            ]}
          />
        </div>
      }
    >
      <div className="mx-auto max-w-2xl p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-1.5 text-2xl font-bold">Skill</h1>
          <p className="text-standard leading-relaxed">
            Skills 扩展 Brier 的任务特定能力，将指令、资源和可选脚本打包， 实现可靠的工作流执行
          </p>
        </div>

        {/* Info banner */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-[#91caff] bg-[#eff8ff] p-3.5">
          <BulbOutlined className="mt-0.5 text-[#1677ff]" />
          <div className="text-standard leading-relaxed">
            <span className="">推荐使用 </span>
            <code className="rounded bg-[#e6f4ff] px-1.5 py-0.5 font-mono text-xs text-[#1677ff]">
              /skill-creator
            </code>
            <span className=""> 命令让 AI 辅助你创建技能，手动上传适合已有技能包的用户。</span>
          </div>
        </div>

        {/* Import tabs */}
        <div className="mb-5 flex items-center gap-1 border-b border-ghost">
          {IMPORT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setImportTab(tab.key)}
              className={`-mb-px border-b-2 px-4 py-2 text-standard font-medium transition-colors ${
                importTab === tab.key ? 'border-brand text-brand' : 'border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Upload or GitHub URL */}
          {importTab === 'zip' ? (
            <div>
              <label className="mb-1.5 block text-standard font-medium">Skill 压缩包</label>
              <Dragger {...uploadProps} className="">
                <p className="mb-2 text-4xl">
                  <InboxOutlined />
                </p>
                <p className="text-standard">点击或拖拽文件到此区域上传</p>
                <p className="mt-1 text-xs">仅支持 .zip 格式</p>
              </Dragger>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-standard font-medium">GitHub 仓库地址</label>
              <Input
                placeholder="https://github.com/username/skill-repo"
                size="large"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <p className="mt-1.5 text-xs">仓库需包含 SKILL.md 文件，系统将自动解析并导入</p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-standard font-medium">分类</label>
            <Select
              value={category}
              onChange={setCategory}
              className="w-full"
              size="large"
              options={CATEGORIES}
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="mb-1.5 block text-standard font-medium">可见性</label>
            <div className="flex items-center gap-4">
              <Radio.Group value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <Radio value="public">公开</Radio>
                <Radio value="private">私有</Radio>
              </Radio.Group>
            </div>
            <p className="mt-1.5 text-xs">
              {visibility === 'public'
                ? '所有空间成员均可安装使用此技能'
                : '仅创建者可安装使用此技能'}
            </p>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-8 flex items-center justify-between border-t border-ghost pt-6">
          <label className="flex cursor-pointer items-center gap-2 text-standard">
            <input
              type="checkbox"
              checked={installForMe}
              onChange={(e) => setInstallForMe(e.target.checked)}
              className="accent-brand"
            />
            为我安装
          </label>
          <Button
            type="primary"
            size="large"
            loading={submitting}
            onClick={handleSubmit}
            className=""
          >
            新建
          </Button>
        </div>
      </div>
    </Page>
  );
};
export default New;
