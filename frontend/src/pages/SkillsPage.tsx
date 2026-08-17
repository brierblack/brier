import { Button, List, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { App } from 'antd';
import { PageCard } from '../components/PageCard';
import { skills } from '../data/mockData';
import { SKILL_TYPE_MAP } from '../define';
import type { Skill } from '../types';

const SKILL_ICONS: Record<Skill['type'], string> = {
  builtin: '📦',
  mcp: '🔗',
  custom: '⚡',
};

export function SkillsPage() {
  const { message } = App.useApp();

  return (
    <PageCard
      title="技能库"
      subtitle="内置工具、MCP 服务与自定义技能"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('技能注册开发中')}>
          注册技能
        </Button>
      }
    >
      <List
        dataSource={skills}
        renderItem={(item) => {
          const cfg = SKILL_TYPE_MAP[item.type];
          return (
            <List.Item style={{ padding: '14px 0', borderBottom: '1px solid var(--color-canvas)' }}>
              <div className="flex items-center gap-3.5 flex-1">
                <div
                  className="size-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${cfg.color}0d`, border: `1px solid ${cfg.color}22` }}
                >
                  {SKILL_ICONS[item.type]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    {item.name}
                    <Tag style={{ background: `${cfg.color}0d`, color: cfg.color, border: 'none' }}>{cfg.label}</Tag>
                  </div>
                  <div className="text-xs text-faint mt-0.5">{item.desc}</div>
                </div>
                <div className="shrink-0">
                  <span className="text-xs text-faint">
                    <span className="font-mono tabular-nums">{item.agents}</span> Agent 使用
                  </span>
                </div>
              </div>
            </List.Item>
          );
        }}
      />
    </PageCard>
  );
}
