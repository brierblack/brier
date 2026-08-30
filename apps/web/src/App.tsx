import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AntdProvider } from '@brierb/brier-ui';
import { AuthProvider } from './context/AuthContext/Provider';
import { Layout as SpaceLayout } from './pages/Space';
import { FullScreen } from './components/Fallback';

const Login = lazy(() => import('./pages/Login'));
const New = lazy(() => import('./pages/Space/New'));
const Chat = lazy(() => import('./pages/Space/Chat'));
const ChatDetail = lazy(() => import('./pages/Space/Chat/Detail'));
const Agents = lazy(() => import('./pages/Space/Agents'));
const AgentDetail = lazy(() => import('./pages/Space/Agents/Detail'));
const NewAgent = lazy(() => import('./pages/Space/Agents/New'));
const Team = lazy(() => import('./pages/Space/Team'));
const TeamDetail = lazy(() => import('./pages/Space/Team/Detail'));
const AgentTasks = lazy(() => import('./pages/Space/AgentTasks'));
const AgentTaskDetail = lazy(() => import('./pages/Space/AgentTasks/Detail'));
const Skills = lazy(() => import('./pages/Space/Skills'));
const SkillDetail = lazy(() => import('./pages/Space/Skills/Detail'));
const SkillNew = lazy(() => import('./pages/Space/Skills/New'));
const Automation = lazy(() => import('./pages/Space/Automation'));
const NewAutomation = lazy(() => import('./pages/Space/Automation/New'));
const AutomationDetail = lazy(() => import('./pages/Space/Automation/Detail'));
const Settings = lazy(() => import('./pages/Space/Settings'));

const App = () => {
  return (
    <AntdProvider>
      <BrowserRouter>
        <Suspense fallback={<FullScreen />}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/space" element={<SpaceLayout />}>
                <Route index element={<Navigate to="/space/chat" replace />} />
                <Route path="/space/new" element={<New />} />
                <Route path="/space/chat" element={<Chat />} />
                <Route path="/space/chat/:id" element={<ChatDetail />} />
                <Route path="/space/agent-tasks" element={<AgentTasks />} />
                <Route path="/space/agent-tasks/:id" element={<AgentTaskDetail />} />
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
          </AuthProvider>
        </Suspense>
      </BrowserRouter>
    </AntdProvider>
  );
};
export default App;
