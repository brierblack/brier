import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { getUser } from '@/context/AuthContext/auth';
import { FullScreen } from '@/components/Fallback';
import { AuthProvider } from '@/context/AuthContext/Provider';

export const Layout = () => {
  const [promiseUser] = useState(() => getUser());
  return (
    <Suspense fallback={<FullScreen />}>
      <AuthProvider promiseUser={promiseUser}>
        <Outlet />
      </AuthProvider>
    </Suspense>
  );
};
