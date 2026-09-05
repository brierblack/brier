import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { createSession, listAgents } from '@/api/generated';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useApi } from '@/hooks/useApi';
import type { Agent } from '../../../types';
import { InputBox, pickDefaultAgent } from './shared';

const SUGGESTIONS = [
  { icon: '📊', text: '帮我分析数据并生成可视化报告' },
  { icon: '🔍', text: '审查我的代码并提出改进建议' },
  { icon: '🧪', text: '为当前项目编写自动化测试用例' },
  { icon: '📄', text: '根据需求文档生成技术方案' },
];

const NewSessionBoard = ({ wsId }: { wsId: string }) => {
  const { data: agents } = useApi(() => listAgents(wsId), [wsId]);
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 数据到达后默认选中一个可执行任务的 Agent（已绑电脑 + runtime）
  useEffect(() => {
    if (!selectedAgent && agents?.length) {
      setSelectedAgent(pickDefaultAgent(agents));
    }
  }, [agents, selectedAgent]);

  // 首句发送：创建真实会话（后端落库首条消息）→ 进入会话详情自动执行任务
  const handleSend = async () => {
    const text = input.trim();
    const agent = selectedAgent;
    if (!text || submitting || !agent) return;

    setSubmitting(true);
    try {
      const session = await createSession(wsId, {
        agent_id: agent.id,
        first_message: text,
      });
      navigate(`/space/session/${session.id}`, {
        state: { runAgentId: agent.id, runPrompt: text },
      });
    } catch (e) {
      // 创建失败静默留在本页（右上角无反馈通道时由控制台可见）
      setSubmitting(false);
      throw e;
    }
  };

  if (!selectedAgent) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        暂无可用 Agent
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <Logo className="h-10 w-10" variant="white" />
        <h1 className="text-xl font-bold">有什么可以帮你？</h1>
        <div className="w-full max-w-3xl">
          <InputBox
            agent={selectedAgent}
            agents={agents ?? []}
            value={input}
            onChange={setInput}
            onSend={() => void handleSend()}
            loading={submitting}
            onAgentSelect={setSelectedAgent}
          />
        </div>
        <div className="grid w-full max-w-2xl grid-cols-2 gap-2">
          {SUGGESTIONS.map((s, i) => (
            <div
              key={i}
              onClick={() => setInput(s.text)}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ghost bg-white p-3 transition-all hover:border-brand hover:bg-[#f5f5f5]"
            >
              <span className="shrink-0 text-base">{s.icon}</span>
              <span className="text-standard">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const NewSessionContent = () => {
  const { currentWsId } = useWorkspace();
  if (!currentWsId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        请先创建工作空间
      </div>
    );
  }
  return <NewSessionBoard wsId={currentWsId} />;
};

const NewSession = () => {
  return <NewSessionContent />;
};

export default NewSession;
