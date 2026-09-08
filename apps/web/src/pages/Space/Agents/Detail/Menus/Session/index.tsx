import { memo, useState } from 'react';
import { createSession, type Agent } from '@/api/generated';
import { InputBox } from '@/pages/Space/Session/shared';
import { App } from 'antd';
import { Avatar } from '@brierb/brier-ui';
import { SessionThread } from '@/pages/Space/Session/thread';

export const Session = memo(
  ({ agent, currentSpaceId }: { agent: Agent; currentSpaceId: string }) => {
    const { message } = App.useApp();
    const [input, setInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [newSession, setNewSession] = useState<{ sessionId: string; bootPrompt: string } | null>(
      null,
    );

    // 首条发送：创建真实会话（后端落库首条 user 消息）→ 进入会话线程自动执行任务
    const handleStart = async () => {
      const text = input.trim();
      if (!text || submitting) return;
      setSubmitting(true);
      try {
        const session = await createSession(currentSpaceId, {
          agent_id: agent.id,
          first_message: text,
        });
        setNewSession({ sessionId: session.id, bootPrompt: text });
      } catch (e) {
        message.error(e instanceof Error ? e.message : '创建会话失败');
        setSubmitting(false);
      }
    };

    if (!newSession) {
      return (
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
            <Avatar src={agent.avatar ?? undefined} shape="square" size={48} alt={agent.name} />
            <div className="text-center">
              <h2 className="text-lg font-bold">和 {agent.name} 开始新会话</h2>
              <p className="mt-1 text-sm text-muted">
                消息将下发到该 Agent 绑定的工作电脑执行，会话记录会保存在会话列表
              </p>
            </div>
            <div className="w-full max-w-2xl">
              <InputBox
                agent={agent}
                agents={[agent]}
                value={input}
                onChange={setInput}
                onSend={() => void handleStart()}
                loading={submitting}
                onAgentSelect={() => {}}
              />
            </div>
          </div>
        </div>
      );
    }

    // 会话已建立：与 /space/session/:id 相同逻辑（Agent 由会话绑定锁定，不可切换）
    return (
      <SessionThread
        key={newSession.sessionId}
        wsId={currentSpaceId}
        sessionId={newSession.sessionId}
        autoRun={{ prompt: newSession.bootPrompt }}
      />
    );
  },
);
