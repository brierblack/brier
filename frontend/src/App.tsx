import { useState } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { themeConfig } from './theme';
import { Layout } from './layouts';
import { AddAgentDrawer } from './components/AddAgentDrawer';
import { Agents } from './pages/Agents';
import { Team } from './pages/Team';
import { Skills } from './pages/Skills';
import { Monitor } from './pages/Monitor';
import { Config } from './pages/Config';
import { UIContext } from './ui-context';

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntApp>
        <UIContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route path="agents" element={<Agents />} />
                <Route path="team" element={<Team />} />
                <Route path="skills" element={<Skills />} />
                <Route path="monitor" element={<Monitor />} />
                <Route path="config" element={<Config />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <AddAgentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </UIContext.Provider>
      </AntApp>
    </ConfigProvider>
  );
}
