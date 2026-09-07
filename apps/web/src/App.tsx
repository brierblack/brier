import { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AntdProvider } from '@brierb/brier-ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './Layout';
import { Layout as SpaceLayout } from './pages/Space';

const Login = lazy(() => import('./pages/Login'));
const SpaceNew = lazy(() => import('./pages/Space/New'));
const Session = lazy(() => import('./pages/Space/Session'));
const SessionDetail = lazy(() => import('./pages/Space/Session/Detail'));
const AgentList = lazy(() => import('./pages/Space/Agents/List'));
const AgentDetail = lazy(() => import('./pages/Space/Agents/Detail'));
const NewAgent = lazy(() => import('./pages/Space/Agents/New'));
const Team = lazy(() => import('./pages/Space/Team'));
const TeamDetail = lazy(() => import('./pages/Space/Team/Detail'));
const Tasks = lazy(() => import('./pages/Space/Tasks'));
const TaskDetail = lazy(() => import('./pages/Space/Tasks/Detail'));
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
              <Route index element={<Navigate to="/space/session" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/space/new" element={<SpaceNew />} />
              <Route path="/space" element={<SpaceLayout />}>
                <Route index element={<Navigate to="/space/session" replace />} />
                <Route path="/space/session" element={<Session />} />
                <Route path="/space/session/:id" element={<SessionDetail />} />
                <Route path="/space/tasks" element={<Tasks />} />
                <Route path="/space/tasks/:id" element={<TaskDetail />} />
                <Route path="/space/agents" element={<AgentList />} />
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
