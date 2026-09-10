import {
  AppstoreOutlined,
  FileTextOutlined,
  FolderOutlined,
  MessageOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { MenuProps } from '@brierb/brier-ui';

export const MENU_ITEMS: MenuProps['items'] = [
  { key: 'overview', icon: <AppstoreOutlined />, label: '概览' },
  {
    type: 'group',
    label: '工作',
    children: [
      { key: 'session', icon: <PlusOutlined />, label: '新会话' },
      { key: 'history', icon: <MessageOutlined />, label: '会话' },
    ],
  },
  {
    type: 'group',
    label: '能力与配置',
    children: [
      { key: 'skills', icon: <ThunderboltOutlined />, label: '技能' },
      { key: 'instructions', icon: <FileTextOutlined />, label: '指令' },
      { key: 'workdir', icon: <FolderOutlined />, label: '工作目录' },
    ],
  },
];

/**
 * Agent 详情"可见性"可编辑档位（public_specified_spaces 无选空间入口，
 * 若 agent 恰为该状态，在 Overview 里只读展示"公开 · 指定空间"）。
 */
export const VISIBILITY_OPTIONS: {
  value: 'private' | 'public_all' | 'public_joined_spaces' | 'public_specified_spaces';
  label: string;
}[] = [
  { value: 'private', label: '私有 · 仅个人可用' },
  { value: 'public_all', label: '公开 · 所有人' },
  { value: 'public_joined_spaces', label: '公开 · 我加入的所有空间' },
  { value: 'public_specified_spaces', label: '公开 · 指定空间' },
];

export const SPARKLINE_DATA = [
  0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

export const MOCK_CONVERSATIONS = [
  { id: 1, title: '优化数据库查询性能', messages: 12, lastActive: '3 分钟前', status: '进行中' },
  { id: 2, title: '修复登录页 OAuth 回调', messages: 8, lastActive: '1 小时前', status: '已完成' },
  { id: 3, title: '重构 API 服务层架构', messages: 15, lastActive: '2 小时前', status: '已完成' },
  { id: 4, title: '编写单元测试覆盖率报告', messages: 6, lastActive: '昨天', status: '已完成' },
  { id: 5, title: '部署 v2.3 到预发环境', messages: 9, lastActive: '3 天前', status: '已完成' },
];
