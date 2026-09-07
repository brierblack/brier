import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Resizable, DragLine } from '@brierb/brier-ui';
import { SpaceProvider } from '@/context/SpaceContext/Provider';
import { getSpaces } from '@/context/SpaceContext/space';
import { NavMenu } from '@/Layout/NavMenu';
import { FullScreen } from '@/components/Fallback';

export const Layout = () => {
  const [promiseSpaces] = useState(() => getSpaces());
  return (
    <Suspense fallback={<FullScreen />}>
      <SpaceProvider promiseSpaces={promiseSpaces}>
        <Resizable>
          <div className="flex h-screen overflow-hidden bg-surface p-2 text-standard">
            <DragLine defaultWidth={280} minWidth={200} maxWidth={480}>
              <aside className="h-full overflow-hidden">
                <NavMenu />
              </aside>
            </DragLine>
            <main className="h-full min-w-0 flex-1 overflow-hidden rounded-2xl border border-ghost">
              <Outlet />
            </main>
          </div>
        </Resizable>
      </SpaceProvider>
    </Suspense>
  );
};
