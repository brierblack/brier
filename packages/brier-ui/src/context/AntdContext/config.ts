import type { ThemeConfig } from 'antd';

export const config: ThemeConfig = {
  token: {
    fontFamily: "'Inter Variable', -apple-system, sans-serif",
    fontSize: 13,
    colorPrimary: '#111111',
    colorBgContainer: '#fbfbfb',
    colorBorder: '#e2e2e2',
    borderRadiusSM: 4,
    borderRadius: 6,
    borderRadiusLG: 8,
  },
  components: {
    Table: {
      headerBg: '#f8f8f8',
      borderColor: '#e2e2e2',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },
    Button: {
      controlHeight: 32,
    },
    Input: {
      controlHeight: 32,
    },
    Select: {
      controlHeight: 32,
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Menu: {
      colorBgElevated: '#fbfbfb',
      boxShadowSecondary: 'none',
      itemHoverBg: '#ebebeb',
      itemActiveBg: '#ebebeb',
      itemSelectedBg: '#ebebeb',
    },
  },
};
