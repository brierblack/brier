import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Page } from '@brierb/brier-ui';
import { useSpace } from '@/context/SpaceContext';
import { listAgents, listSessions } from '@/api/generated';
import { useRequest } from '@/hooks/useRequest';
import { SessionThread } from '../thread';

const SessionDetailBody = ({ wsId }: { wsId: string }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: sessions } = useRequest(listSessions, [wsId]);
  const session = (sessions ?? []).find((s) => s.id === id);

  const { data: agents } = useRequest(listAgents, [wsId]);
  // 会话绑定 Agent（会话创建时选定，会话内不切换）
  const sessionAgent = useMemo(
    () => (session ? (agents ?? []).find((a) => a.id === session.agent_id) : undefined),
    [agents, session],
  );

  // 来自新会话板的首条：进入后由 SessionThread 自动执行一次
  const boot = (location.state as { runAgentId?: string; runPrompt?: string } | null) ?? null;

  if (!session || !sessionAgent) {
    return (
      <Page header={<span>会话未找到</span>}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-standard">未找到该会话或加载中</p>
            <Button onClick={() => navigate('/space/session')}>返回</Button>
          </div>
        </div>
      </Page>
    );
  }

  const title = session.title || '新会话';

  return (
    <Page title={title}>
      <SessionThread
        key={session.id}
        wsId={wsId}
        sessionId={session.id}
        autoRun={boot?.runPrompt ? { prompt: boot.runPrompt } : null}
      />
    </Page>
  );
};

const SessionDetailContent = () => {
  const { currentSpaceId } = useSpace();
  if (!currentSpaceId) {
    return (
      <Page header={<span>无可用空间</span>}>
        <div className="flex h-full items-center justify-center text-sm text-muted">
          请先创建工作空间
        </div>
      </Page>
    );
  }
  return <SessionDetailBody wsId={currentSpaceId} />;
};

const SessionDetail = () => {
  return <SessionDetailContent />;
};

export default SessionDetail;
