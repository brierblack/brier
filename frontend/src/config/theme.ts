import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#fe6e00',
    colorPrimaryHover: '#f05100',
    colorPrimaryActive: '#f05100',
    colorSuccess: '#00c758',
    colorWarning: '#f99c00',
    colorError: '#fb2c36',
    colorInfo: '#8d54ff',
    colorBgLayout: '#f1f5f9',
    colorBgElevated: '#fbfbfb',
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
    Menu: {
      itemBg: 'transparent',
      itemColor: '#62748e',
      itemHoverBg: 'rgba(0,0,0,0.04)',
      itemBorderRadius: 6,
      itemMarginInline: 8,
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#90a1b9',
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
