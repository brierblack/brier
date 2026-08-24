import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './config/theme';
import { Layout } from './layouts';
import { Chat } from './pages/Chat';
import { Agents } from './pages/Agents';
import { NewAgent } from './pages/Agents/New';
import { Team } from './pages/Team';
import { Skills } from './pages/Skills';
import { Settings } from './pages/Settings';
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
                <Route index element={<Navigate to="/chat" replace />} />
                <Route path="chat" element={<Chat />} />
                <Route path="agents" element={<Agents />} />
                <Route path="agents/new" element={<NewAgent />} />
                <Route path="team" element={<Team />} />
                <Route path="skills" element={<Skills />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
