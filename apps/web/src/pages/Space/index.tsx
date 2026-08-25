import { Outlet } from 'react-router-dom';
import { NavMenu } from './components/NavMenu';
import { Resizable, DragLine } from '@hiveblack/ui';

export const Layout = () => {
  return (
    <Resizable>
      <div className="h-screen overflow-hidden flex bg-[#f4f4f4] p-2">
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
