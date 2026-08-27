import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, Spin } from 'antd';
import { ThemeProvider } from '@brierb/ui';
import { AuthProvider } from './auth-context';
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
const SkillDetail = lazy(() => import('./pages/Space/Skills/Detail'));
const SkillNew = lazy(() => import('./pages/Space/Skills/New'));
const Automation = lazy(() => import('./pages/Space/Automation'));
const NewAutomation = lazy(() => import('./pages/Space/Automation/New'));
const AutomationDetail = lazy(() => import('./pages/Space/Automation/Detail'));
const Settings = lazy(() => import('./pages/Space/Settings'));

const PageLoading = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spin size="large" />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AntApp>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/space"
                  element={
                    //<AuthGuard>
                    <SpaceLayout />
                    //</AuthGuard>
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
                  <Route path="/space/skills/:name" element={<SkillDetail />} />
                  <Route path="/space/skills/new" element={<SkillNew />} />
                  <Route path="/space/automation" element={<Automation />} />
                  <Route path="/space/automation/new" element={<NewAutomation />} />
                  <Route path="/space/automation/:id" element={<AutomationDetail />} />
                  <Route path="/space/settings" element={<Settings />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </AntApp>
    </ThemeProvider>
  );
};
export default App;
