import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './config/theme';
import { Layout } from './layouts';
import { Agents } from './pages/Agents';
import { NewAgent } from './pages/Agents/New';
import { Team } from './pages/Team';
import { Skills } from './pages/Skills';
import { Config } from './pages/Config';
import { CreateSpace } from './pages/CreateSpace';
import { AuthProvider } from './auth-context';

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme} wave={{ disabled: true }}>
      <AntApp>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/spaces/new" element={<CreateSpace />} />
              <Route path="/" element={<Layout />}>
                <Route path="agents" element={<Agents />} />
                <Route path="agents/new" element={<NewAgent />} />
                <Route path="team" element={<Team />} />
                <Route path="skills" element={<Skills />} />
                <Route path="config" element={<Config />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
