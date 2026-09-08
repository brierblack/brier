import { memo, useCallback, useMemo, useState } from 'react';
import { App } from 'antd';
import type { ItemType } from 'antd/lib/menu/interface';
import { DeleteOutlined, EllipsisOutlined, MessageOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu } from '@brierb/brier-ui';
import { deleteSession, listSessions, type Session } from '@/api/generated';
import { useSpace } from '@/context/SpaceContext';
import { useRequest } from '@/hooks/useRequest';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Arrow } from './Arrow';

export const SessionList = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { message, modal } = App.useApp();

  const { currentSpaceId } = useSpace();
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [olderExpanded, setOlderExpanded] = useState(false);
  // 会话列表（当前空间；删除会话后手动 run() 重取）
  const { data: sessions, run: runSessionsList } = useRequest(listSessions, [currentSpaceId]);

  const handleDeleteSession = useCallback(
    (session: Session) => {
      modal.confirm({
        title: `删除会话「${session.title}」`,
        content: '删除后该会话及其消息将一并移除。',
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          try {
            await deleteSession(currentSpaceId, session.id);
            message.success('已删除');
            runSessionsList(currentSpaceId);
            if (location.pathname === `/space/session/${session.id}`) {
              navigate('/space/session');
            }
          } catch (e) {
            message.error(e instanceof Error ? e.message : '删除失败');
          }
        },
      });
    },
    [navigate, runSessionsList],
  );

  const convertSession = useCallback(
    (session: Session) => {
      return {
        key: session.id,
        icon: <MessageOutlined />,
        label: session.title,
        className: 'flex group',
        extra: (
          <div className="opacity-0 group-hover:opacity-100">
            <Dropdown
              menu={{
                items: [{ key: 'delete', label: '删除', icon: <DeleteOutlined /> }],
                onClick: () => handleDeleteSession(session),
              }}
              trigger={['click']}
            >
              <Button
                size="small"
                bordered={false}
                icon={<EllipsisOutlined />}
                onClick={(e) => e.stopPropagation()}
                classNames={{ root: 'hover:bg-ghost! rounded-full!' }}
              />
            </Dropdown>
          </div>
        ),
      } as ItemType;
    },
    [handleDeleteSession],
  );

  const [recentItems, olderItems] = useMemo(() => {
    if (!sessions) return [[], []];

    return sessions.reduce<[ItemType[], ItemType[]]>(
      (pre, cur) => {
        const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
        const isRecent = new Date(cur.updated_at).getTime() >= weekAgo;
        if (isRecent) {
          pre[0].push(convertSession(cur));
        } else {
          pre[1].push(convertSession(cur));
        }
        return pre;
      },
      [[], []],
    );
  }, [sessions, convertSession]);

  const selectedSessionKeys = useMemo(() => {
    if (location.pathname.startsWith('/space/session/')) {
      return params.id ? [params.id] : [];
    }
    return [];
  }, [location.pathname, params.id]);

  const renderRecentSessions = useCallback(() => {
    if (recentExpanded) {
      if (recentItems.length > 0) {
        return (
          <Menu
            mode="vertical"
            selectedKeys={selectedSessionKeys}
            items={recentItems}
            onClick={({ key }) => navigate(`/space/session/${key}`)}
          />
        );
      } else {
        return <div className="px-2 py-2 text-xs text-muted">暂无会话，点击上方「新会话」开始</div>;
      }
    }
  }, [recentExpanded, selectedSessionKeys, recentItems, navigate]);

  const renderOlderSessions = useCallback(() => {
    if (olderExpanded) {
      return (
        <Menu
          mode="vertical"
          selectedKeys={selectedSessionKeys}
          items={olderItems}
          onClick={({ key }) => navigate(`/space/session/${key}`)}
        />
      );
    }
  }, [olderExpanded, selectedSessionKeys, olderItems, navigate]);

  return (
    <div>
      <div>
        <div
          className="group flex cursor-pointer items-center gap-1 px-2 py-1 text-standard font-medium"
          onClick={() => setRecentExpanded(!recentExpanded)}
        >
          最近 7 天
          <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
            <Arrow expanded={recentExpanded} />
          </span>
        </div>
        {renderRecentSessions()}
      </div>
      {olderItems.length > 0 && (
        <div>
          <div
            className="group flex cursor-pointer items-center gap-1 px-2 py-1 text-standard font-medium"
            onClick={() => setOlderExpanded(!olderExpanded)}
          >
            更早
            <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
              <Arrow expanded={olderExpanded} />
            </span>
          </div>
          {renderOlderSessions()}
        </div>
      )}
    </div>
  );
});
