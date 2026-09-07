import type { ReactNode } from 'react';
import { ConfigProvider, type ThemeConfig, App } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { config } from './config';

interface AntdProviderProps {
  children: ReactNode;
  theme?: ThemeConfig;
  locale?: typeof zhCN;
}

export const AntdProvider = ({ children, theme = config, locale = zhCN }: AntdProviderProps) => {
  return (
    <ConfigProvider
      locale={locale}
      theme={theme}
      wave={{ disabled: true }}
      spin={{ indicator: <LoadingOutlined spin /> }}
      modal={{
        cancelButtonProps: {
          type: 'text',
          classNames: { root: 'border! border-ghost!' },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
};
