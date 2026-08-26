import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Tag } from 'antd';
import { Button } from '@hiveblack/ui';
import { App } from 'antd';
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
    desc: 'Skills 扩展 Hive 的任务特定能力，将指令、资源和可选脚本打包，实现可靠的工作流执行',
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
    if (filterTab === 'mine') result = result.filter((s) => s.author === 'Hive');
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
    <div className="flex h-full flex-col bg-canvas">
      {/* Top tab nav */}
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-ghost px-4">
        {TOP_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTopTab(tab.key)}
            className={`h-full border-b-2 px-4 text-2xl text-standard font-medium transition-colors ${
              topTab === tab.key ? 'border-brand text-brand' : 'border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <h1 className="mb-1 text-2xl font-bold">{TOP_TAB_CONFIG[topTab].title}</h1>
        <p className="text-standard leading-relaxed">{TOP_TAB_CONFIG[topTab].desc}</p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 px-6 pb-4">
        <Input
          placeholder="请输入技能名称"
          prefix={<SearchOutlined className="" />}
          style={{ width: 360 }}
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

      {/* Featured section */}
      <div className="px-6 pb-6">
        <div className="mb-3 flex items-center gap-2">
          <FireOutlined style={{ color: '#fe6e00' }} />
          <span className="text-standard font-medium">精选技能</span>
          <span className="text-xs">经过验证的优质技能</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
          {featuredSkills.map((skill) => (
            <SkillCard key={skill.name} skill={skill} compact />
          ))}
        </div>
      </div>

      {/* All skills section */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="rounded-xl border border-ghost">
          {/* Source tabs + filter tabs */}
          <div className="flex items-center justify-between border-b border-ghost px-4 pt-3">
            <div className="flex items-center gap-1">
              {SOURCE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSourceTab(tab.key)}
                  className={`rounded-t-md px-3 py-2 text-standard font-medium transition-colors ${
                    sourceTab === tab.key ? '-mb-px border-b-2 border-brand text-brand' : ''
                  }`}
                >
                  {tab.label}{' '}
                  <span className="font-mono text-xs tabular-nums">
                    {tab.key === 'internal' ? internalCount : communityCount}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 pb-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    filterTab === tab.key ? 'text-white' : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
  );
};
export default Skills;
