import { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AntdProvider } from '@brierb/brier-ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './Layout';
import { Layout as SpaceLayout } from './pages/Space';

const Login = lazy(() => import('./pages/Login'));
const New = lazy(() => import('./pages/Space/New'));
const Session = lazy(() => import('./pages/Space/Session'));
const SessionDetail = lazy(() => import('./pages/Space/Session/Detail'));
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
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/space/new" element={<New />} />
              <Route path="/space" element={<SpaceLayout />}>
                <Route path="/space/session" element={<Session />} />
                <Route path="/space/session/:id" element={<SessionDetail />} />
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
            </Route>
            <Route path="*" element={<Navigate to="/space/session" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </AntdProvider>
  );
};
export default App;
