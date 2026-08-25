import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { theme } from './config/theme';
import { AuthProvider, useAuth } from './auth-context';
import { Layout as SpaceLayout } from './pages/Space';

const Login = lazy(() => import('./pages/Login'));
const New = lazy(() => import('./pages/Space/New'));
const Chat = lazy(() => import('./pages/Space/Chat'));
const Agents = lazy(() => import('./pages/Space/Agents'));
const AgentDetail = lazy(() => import('./pages/Space/Agents/Detail'));
const NewAgent = lazy(() => import('./pages/Space/Agents/New'));
const Team = lazy(() => import('./pages/Space/Team'));
const TeamDetail = lazy(() => import('./pages/Space/Team/Detail'));
const Skills = lazy(() => import('./pages/Space/Skills'));
const SkillNew = lazy(() => import('./pages/Space/Skills/New'));
const Settings = lazy(() => import('./pages/Space/Settings'));

const PageLoading = () => {
  return (
    <div className="h-screen flex items-center justify-center">
      <Spin size="large" />
    </div>
  );
};

const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <ConfigProvider locale={zhCN} theme={theme} wave={{ disabled: true }}>
      <AntApp>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/space"
                  element={
                    <AuthGuard>
                      <SpaceLayout />
                    </AuthGuard>
                  }
                >
                  <Route index element={<Navigate to="/space/chat" replace />} />
                  <Route path="/space/new" element={<New />} />
                  <Route path="/space/chat" element={<Chat />} />
                  <Route path="/space/agents" element={<Agents />} />
                  <Route path="/space/agents/:id" element={<AgentDetail />} />
                  <Route path="/space/agents/new" element={<NewAgent />} />
                  <Route path="/space/team" element={<Team />} />
                  <Route path="/space/team/:id" element={<TeamDetail />} />
                  <Route path="/space/skills" element={<Skills />} />
                  <Route path="/space/skills/new" element={<SkillNew />} />
                  <Route path="/space/settings" element={<Settings />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
};
export default App;
