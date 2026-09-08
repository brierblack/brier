import { updateAgent, type Agent } from '@/api/generated';
import { Button } from '@brierb/brier-ui';
import { App, Input } from 'antd';
import { useEffect, useState } from 'react';

export const WorkDir = ({ agent, currentSpaceId }: { agent: Agent; currentSpaceId: string }) => {
  const { message } = App.useApp();
  const [path, setPath] = useState('');
  const [saving, setSaving] = useState(false);

  // 跟随 Agent 真实工作目录
  useEffect(() => {
    setPath(agent.workdir ?? '');
  }, [agent.workdir]);

  /** 保存工作目录 */
  const handleSaveWorkdir = async (workdir: string) => {
    if (!agent) return;
    try {
      await updateAgent(currentSpaceId, agent.id, { workdir });
      message.success('工作目录已保存');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败');
      throw e;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await handleSaveWorkdir(path.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl">
        <div className="mb-1 text-standard font-bold">工作目录</div>
        <p className="mb-4 text-xs">Agent 执行任务时使用的工作目录，填写本机绝对路径</p>
        <Input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/Users/username/project"
          className="font-mono"
        />
        <div className="mt-4">
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};
