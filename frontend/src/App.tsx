import { useState } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { themeConfig } from './theme';
import { MainLayout } from './layouts/MainLayout';
import { AddAgentDrawer } from './components/AddAgentDrawer';
import { AgentPage } from './pages/AgentPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { TeamPage } from './pages/TeamPage';
import { SkillsPage } from './pages/SkillsPage';
import { MonitorPage } from './pages/MonitorPage';
import { ConfigPage } from './pages/ConfigPage';
import type { PageKey } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('agent');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'agent':
        return <AgentPage onAddAgent={() => setDrawerOpen(true)} />;
      case 'workspace':
        return <WorkspacePage />;
      case 'team':
        return <TeamPage />;
      case 'skills':
        return <SkillsPage />;
      case 'monitor':
        return <MonitorPage />;
      case 'config':
        return <ConfigPage />;
      default:
        return null;
    }
  };

  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntApp>
        <MainLayout activePage={activePage} onNavigate={setActivePage}>
          {renderPage()}
        </MainLayout>
        <AddAgentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </AntApp>
    </ConfigProvider>
  );
}
