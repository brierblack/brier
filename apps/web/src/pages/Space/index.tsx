import { Outlet } from 'react-router-dom';
import { NavMenu } from './components/NavMenu';
import { Resizable, DragLine } from '@hiveblack/ui';

export const Layout = () => {
  return (
    <Resizable>
      <div className="h-screen overflow-hidden flex bg-work-secondary p-2 text-standard">
        <DragLine defaultWidth={250} minWidth={200} maxWidth={480}>
          <aside className=" h-full overflow-hidden">
            <NavMenu />
          </aside>
        </DragLine>
        <main className=" flex-1 h-full overflow-hidden min-w-0 border border-line rounded-2xl">
          <Outlet />
        </main>
      </div>
    </Resizable>
  );
};
