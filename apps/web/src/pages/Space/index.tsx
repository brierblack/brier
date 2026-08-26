import { Outlet } from 'react-router-dom';
import { NavMenu } from '../../components/NavMenu';
import { Resizable, DragLine } from '@hiveblack/ui';

export const Layout = () => {
  return (
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
  );
};
