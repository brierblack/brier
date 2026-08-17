import { type ReactNode } from 'react';
import { Layout, Splitter } from 'antd';
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
      <Splitter>
        <Splitter.Panel defaultSize="40%" min="20%" max="70%">
          <Sider width={232} style={{ background: 'transparent' }}>
            <Sidebar activePage={activePage} onNavigate={onNavigate} />
          </Sider>
        </Splitter.Panel>
        <Splitter.Panel>
          <Content
            className=" pr-2 py-2 rounded-2xl"
            style={{ background: '#f1f5f9', overflow: 'auto' }}
          >
            {children}
          </Content>
        </Splitter.Panel>
      </Splitter>
    </Layout>
  );
}
