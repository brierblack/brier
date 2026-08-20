import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#fe6e00',
    colorBgLayout: '#f1f5f9',
    colorText: '#0f172b',
    colorTextSecondary: '#62748e',
    colorTextTertiary: '#90a1b9',
    colorTextQuaternary: '#cad5e2',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
    borderRadius: 6,
    fontFamily: "'Inter Variable', -apple-system, sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: 'transparent',
      headerBg: 'transparent',
      bodyBg: '#f1f5f9',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#62748e',
      itemHoverBg: 'rgba(0,0,0,0.04)',
      itemSelectedBg: 'rgba(254,110,0,0.08)',
      itemSelectedColor: '#fe6e00',
      itemBorderRadius: 6,
      itemMarginInline: 8,
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#90a1b9',
      borderColor: '#e2e8f0',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },
    Button: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Tag: {
      borderRadiusSM: 4,
    },
  },
};
