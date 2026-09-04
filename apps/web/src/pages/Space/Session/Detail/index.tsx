import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Page } from '@brierb/brier-ui';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useWorkspace } from '@/context/WorkspaceContext';
import { listAgents, listSessions } from '@/api/generated';
import { useApi } from '@/hooks/useApi';
import { SessionThread } from '../thread';

const SessionDetailBody = ({ wsId }: { wsId: string }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: sessions } = useApi(() => listSessions(wsId), [wsId]);
  const session = (sessions ?? []).find((s) => s.id === id);

  const { data: agents } = useApi(() => listAgents(wsId), [wsId]);
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
    <Page
      header={
        <div className="flex items-center gap-3 py-2.5">
          <Button bordered={false} onClick={() => navigate('/space/session')}>
            <ArrowLeftOutlined className="shrink-0 cursor-pointer text-standard hover:text-brand" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="m-0 truncate text-lg font-bold">{title}</h1>
            <p className="mt-0.5 text-xs text-muted">
              {sessionAgent ? `与 ${sessionAgent.name} 的会话` : '会话'}
            </p>
          </div>
        </div>
      }
    >
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
  const { currentWsId } = useWorkspace();
  if (!currentWsId) {
    return (
      <Page header={<span>无可用空间</span>}>
        <div className="flex h-full items-center justify-center text-sm text-muted">
          请先创建工作空间
        </div>
      </Page>
    );
  }
  return <SessionDetailBody wsId={currentWsId} />;
};

const SessionDetail = () => {
  return <SessionDetailContent />;
};

export default SessionDetail;
