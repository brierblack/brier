import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#fe6e00',
    colorBgContainer: '#fbfbfb',
    borderRadius: 6,
    fontFamily: "'Inter Variable', -apple-system, sans-serif",
    fontSize: 13,
  },
  components: {
    Menu: {
    },
    Table: {
      headerBg: '#f8f8f8',
      borderColor: "#e3e3e3",
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
  },
};
