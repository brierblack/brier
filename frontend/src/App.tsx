import { lazy, useState } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { themeConfig } from './theme';
import { Layout } from './layouts';
import { AddAgentDrawer } from './components/AddAgentDrawer';
import { AgentPage } from './pages/AgentPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { TeamPage } from './pages/TeamPage';
import { SkillsPage } from './pages/SkillsPage';
import { MonitorPage } from './pages/MonitorPage';
import { ConfigPage } from './pages/ConfigPage';
import { UIContext } from './ui-context';

const Agents = lazy(()=> import('./pages/Agents'));

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntApp>
        <UIContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Agents />} />
                <Route path="agent" element={<AgentPage />} />
                <Route path="workspace" element={<WorkspacePage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="skills" element={<SkillsPage />} />
                <Route path="monitor" element={<MonitorPage />} />
                <Route path="config" element={<ConfigPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <AddAgentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </UIContext.Provider>
      </AntApp>
    </ConfigProvider>
  );
}
