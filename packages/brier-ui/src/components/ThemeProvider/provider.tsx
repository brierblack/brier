import type { ReactNode } from 'react';
import { ConfigProvider as AntdConfigProvider, type ThemeConfig } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { theme as defaultTheme } from './theme';

interface ThemeProviderProps {
  children: ReactNode;
  theme?: ThemeConfig;
  locale?: typeof zhCN;
}

export const ThemeProvider = ({
  children,
  theme = defaultTheme,
  locale = zhCN,
}: ThemeProviderProps) => {
  return (
    <AntdConfigProvider locale={locale} theme={theme} wave={{ disabled: true }}>
      {children}
    </AntdConfigProvider>
  );
};
