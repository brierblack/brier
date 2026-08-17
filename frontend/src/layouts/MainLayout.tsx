import { type ReactNode } from 'react';
import { Layout } from 'antd';
import { Sidebar } from '../components/Sidebar';
import type { PageKey } from '../types';

const { Sider, Content } = Layout;

interface MainLayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function MainLayout({ activePage, onNavigate, children }: MainLayoutProps) {
  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={232} style={{ background: 'transparent' }}>
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
      </Sider>
      <Content className=' pr-2 py-2 rounded-2xl' style={{ background: '#f1f5f9', overflow: 'auto' }}>{children}</Content>
    </Layout>
  );
}
