import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Input, Segmented, Tag } from 'antd';
import { Button, Page } from '@brierb/ui';
import { PlusOutlined, SearchOutlined, FireOutlined } from '@ant-design/icons';
import { skills } from '../../../data/mockData';
import { SKILL_TYPE_MAP } from '../../../define';
import type { Skill } from '../../../types';

const SKILL_ICONS: Record<Skill['type'], string> = {
  builtin: '📦',
  mcp: '🔗',
  custom: '⚡',
};

const TOP_TABS = [
  { key: 'skill', label: 'Skill' },
  { key: 'plugin', label: 'Plugin' },
  { key: 'mcp', label: 'MCP' },
] as const;

const TOP_TAB_CONFIG: Record<string, { title: string; desc: string }> = {
  skill: {
    title: 'Skill 技能',
    desc: 'Skills 扩展 Brier 的任务特定能力，将指令、资源和可选脚本打包，实现可靠的工作流执行',
  },
  plugin: {
    title: 'Plugin 插件',
    desc: 'Plugins 是更重量级的扩展，提供完整的工具链和自定义命令集成',
  },
  mcp: {
    title: 'MCP 服务',
    desc: 'Model Context Protocol 服务，标准化连接外部工具和数据源',
  },
};

const CATEGORIES = [
  '全部',
  '未分类',
  '工具',
  '开发',
  '商业',
  '设计',
  '数据/AI',
  '运维',
  '测试/安全',
  '文档',
  '内容/媒体',
  '研究',
  '数据库',
  '生活',
  '区块链',
  '智能',
];

const FILTER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'mine', label: '我创建的' },
  { key: 'installed', label: '已安装' },
  { key: 'not-installed', label: '未安装' },
] as const;

const SOURCE_TABS = [
  { key: 'internal', label: '内部' },
  { key: 'community', label: '社区' },
] as const;

const SkillCard = ({ skill, compact }: { skill: Skill; compact?: boolean }) => {
  const { message } = App.useApp();
  const cfg = SKILL_TYPE_MAP[skill.type];

  return (
    <div
      className={`flex flex-col gap-2 ${compact ? 'w-[280px] shrink-0' : 'w-full'} rounded-xl border border-ghost bg-white p-4 transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-lg"
          style={{ background: `${cfg.color}0d`, border: `1px solid ${cfg.color}22` }}
        >
          {SKILL_ICONS[skill.type]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-standard font-medium">{skill.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Tag
              style={{
                background: `${cfg.color}0d`,
                color: cfg.color,
                border: 'none',
                fontSize: 11,
                lineHeight: '18px',
                padding: '0 6px',
              }}
            >
              {skill.category}
            </Tag>
            <span className="text-xs">{skill.source === 'internal' ? '内部' : '社区'}</span>
          </div>
        </div>
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed">{skill.desc}</p>

      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-xs">
          {skill.author} · <span className="font-mono tabular-nums">{skill.installs}</span>
        </span>
        <Button
          type={skill.installed ? 'default' : 'primary'}
          size="small"
          className="!text-xs"
          onClick={() => message.info(skill.installed ? '卸载中...' : '安装中...')}
        >
          {skill.installed ? '已安装' : '安装'}
        </Button>
      </div>
    </div>
  );
};

const Skills = () => {
  const navigate = useNavigate();
  const [topTab, setTopTab] = useState<string>('skill');
  const [search, setSearch] = useState('');
  const [sourceTab, setSourceTab] = useState<string>('internal');
  const [filterTab, setFilterTab] = useState<string>('all');
  const [category, setCategory] = useState<string>('全部');

  const featuredSkills = useMemo(() => skills.filter((s) => s.featured), []);

  const filteredSkills = useMemo(() => {
    let result = skills;
    if (topTab === 'mcp') result = result.filter((s) => s.type === 'mcp');
    if (topTab === 'plugin') result = [];
    if (sourceTab === 'internal') result = result.filter((s) => s.source === 'internal');
    if (sourceTab === 'community') result = result.filter((s) => s.source === 'community');
    if (filterTab === 'mine') result = result.filter((s) => s.author === 'Brier');
    if (filterTab === 'installed') result = result.filter((s) => s.installed);
    if (filterTab === 'not-installed') result = result.filter((s) => !s.installed);
    if (category !== '全部' && category !== '未分类')
      result = result.filter((s) => s.category === category);
    if (category === '未分类') result = result.filter((s) => !s.category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q),
      );
    }
    return result;
  }, [sourceTab, filterTab, category, search]);

  const internalCount = skills.filter((s) => s.source === 'internal').length;
  const communityCount = skills.filter((s) => s.source === 'community').length;

  return (
    <Page
      header={
        <Segmented
          options={TOP_TABS.map((t) => ({ label: t.label, value: t.key }))}
          value={topTab}
          onChange={(v) => setTopTab(v as string)}
        />
      }
    >
      <div className="flex flex-col items-center p-4">
        <div className="flex max-w-160 flex-col items-center">
          {/* Header */}
          <div className="mt-6 text-3xl font-bold">{TOP_TAB_CONFIG[topTab].title}</div>
          <div className="mt-6">{TOP_TAB_CONFIG[topTab].desc}</div>

          {/* Search bar */}
          <div className="mt-6 flex w-full items-center gap-3">
            <Input
              placeholder="请输入技能名称"
              prefix={<SearchOutlined className="" />}
              size="large"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
            <Button
              type="primary"
              size="large"
              shape="circle"
              icon={<PlusOutlined />}
              onClick={() => navigate('/space/skills/new')}
            />
          </div>
        </div>

        {/* Featured section */}
        <div className="mt-12 w-full overflow-hidden pb-6">
          <div className="mb-3 flex items-center gap-2">
            <FireOutlined style={{ color: '#fe6e00' }} />
            <span className="text-standard font-medium">精选技能</span>
            <span className="text-xs">经过验证的优质技能</span>
          </div>
          <div className="flex gap-3 overflow-x-auto">
            {featuredSkills.map((skill) => (
              <SkillCard key={skill.name} skill={skill} compact />
            ))}
          </div>
        </div>

        {/* All skills section */}
        <div className="flex-1 px-6">
          <div className="rounded-xl border border-ghost">
            {/* Source tabs + filter tabs */}
            <div className="flex items-center justify-between border-b border-ghost px-4 pt-3 pb-3">
              <Segmented
                options={SOURCE_TABS.map((t) => ({
                  label: (
                    <span>
                      {t.label}{' '}
                      <span className="font-mono text-xs tabular-nums">
                        {t.key === 'internal' ? internalCount : communityCount}
                      </span>
                    </span>
                  ),
                  value: t.key,
                }))}
                value={sourceTab}
                onChange={(v) => setSourceTab(v as string)}
              />
              <Segmented
                size="small"
                options={FILTER_TABS.map((t) => ({ label: t.label, value: t.key }))}
                value={filterTab}
                onChange={(v) => setFilterTab(v as string)}
              />
            </div>

            {/* Category tags */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-ghost px-4 py-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${
                    category === cat ? 'font-medium text-brand' : ''
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>

            {/* Skill list */}
            <div className="p-4">
              {filteredSkills.length === 0 ? (
                <div className="py-12 text-center text-standard">没有找到匹配的技能</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredSkills.map((skill) => (
                    <SkillCard key={skill.name} skill={skill} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};
export default Skills;
