import { Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { NavMenu } from '../../components/NavMenu';
import { Resizable, DragLine } from '@brierb/brier-ui';
import { listWorkspaces } from '@/api/generated';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { useApi } from '@/hooks/useApi';

export const Layout = () => {
  const { data: workspaces, loading } = useApi(listWorkspaces, []);

  if (loading || !workspaces) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin />
      </div>
    );
  }

  return (
    <WorkspaceProvider workspaces={workspaces}>
      <Resizable>
        <div className="flex h-screen overflow-hidden bg-surface p-2 text-standard">
          <DragLine defaultWidth={250} minWidth={200} maxWidth={480}>
            <aside className="h-full overflow-hidden">
              <NavMenu />
            </aside>
          </DragLine>
          <main className="h-full min-w-0 flex-1 overflow-hidden rounded-2xl border border-ghost">
            <Outlet />
          </main>
        </div>
      </Resizable>
    </WorkspaceProvider>
  );
};
