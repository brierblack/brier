import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Tabs } from 'antd';
import { PlusOutlined, LockOutlined, CheckOutlined } from '@ant-design/icons';
import { Page } from '@/components/Page';
import { Tag } from '@/components/Tag';
import { teams } from '../../../../data/mockData';

interface MemberDetail {
  id: number;
  name: string;
  icon: string;
  color: string;
  role: string;
  status: 'online' | 'offline';
  isMain?: boolean;
}

const MOCK_MEMBERS: MemberDetail[] = [
  {
    id: 1,
    name: '总参谋部 Agent',
    icon: '📋',
    color: '#1677ff',
    role: '负责人',
    status: 'online',
    isMain: true,
  },
  {
    id: 2,
    name: '纪律监察团 Agent',
    icon: '🔍',
    color: '#8d54ff',
    role: 'reviewer',
    status: 'online',
  },
  {
    id: 3,
    name: '工程突击营 Agent',
    icon: '⚙️',
    color: '#fe6e00',
    role: 'frontend',
    status: 'online',
  },
  { id: 4, name: '中央兵工厂 Agent', icon: '🛡️', color: '#fb2c36', role: '', status: 'online' },
  { id: 5, name: '情报侦察连 Agent', icon: '📡', color: '#00c758', role: '', status: 'online' },
];

const SHARING_OPTIONS = [
  { value: 'space', label: '空间共享', desc: '空间成员可指派或 @' },
  { value: 'private', label: '仅自己', desc: '仅创建者可见' },
];

const INSTRUCTION_EXAMPLE = `分析需求，明确环境

- @情报侦察连 拆解需求
- @中央兵工厂 创建迭代
- @工程突击营 编写代码
- @纪律检查团 code reviewer`;

const MemberAvatar = ({
  icon,
  color,
  size = 36,
}: {
  icon: string;
  color: string;
  size?: number;
}) => {
  return (
    <div
      className="flex items-center justify-center rounded-lg shrink-0"
      style={{ width: size, height: size, backgroundColor: color + '1a', fontSize: size * 0.5 }}
    >
      {icon}
    </div>
  );
};

const SharingScope = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) => {
  return (
    <div className="mb-6">
      <div className="text-sm font-bold text-ink mb-1">共享范围</div>
      <p className="text-xs text-faint mb-3">控制团队是否出现在空间成员的指派和 @ 列表中。</p>
      <div className="flex flex-col gap-2">
        {SHARING_OPTIONS.map((opt) => (
          <div
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              selected === opt.value
                ? 'border-brand bg-[#fff5ed]'
                : 'border-line bg-white hover:border-line'
            }`}
          >
            {opt.value === 'private' && <LockOutlined className="text-sm text-faint" />}
            <div className="flex-1">
              <div className="text-sm font-medium text-ink">{opt.label}</div>
              <div className="text-xs text-faint mt-0.5">{opt.desc}</div>
            </div>
            {selected === opt.value && <CheckOutlined className="text-sm text-brand" />}
          </div>
        ))}
      </div>
    </div>
  );
};

const MembersTab = ({ members }: { members: MemberDetail[] }) => {
  const [sharing, setSharing] = useState('space');

  return (
    <div className="p-6 max-w-3xl">
      <SharingScope selected={sharing} onSelect={setSharing} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-ink">团队成员</div>
            <p className="text-xs text-faint mt-0.5">
              共 {members.length} 名成员，由主 Agent 负责协调
            </p>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>
            添加成员
          </Button>
        </div>

        <div className="border border-line rounded-lg overflow-hidden divide-y divide-line">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-white">
              <MemberAvatar icon={m.icon} color={m.color} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{m.name}</span>
                  {m.isMain && <Tag color="#fe6e00">主 Agent</Tag>}
                  {m.role && !m.isMain && <Tag color="#8d54ff">{m.role}</Tag>}
                  {!m.role && !m.isMain && (
                    <span className="text-xs text-faint cursor-pointer hover:text-brand">
                      添加角色…
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ background: '#389e0d' }} />
                <span className="text-xs text-faint">在线</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const InstructionsTab = () => {
  const [instructions, setInstructions] = useState(INSTRUCTION_EXAMPLE);

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-ink">团队指令</span>
        <Button type="primary" size="small">
          保存
        </Button>
      </div>
      <p className="text-xs text-faint mb-4">写给主 Agent 的协调规则、分工偏好和交付标准</p>
      <Input.TextArea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={12}
        style={{ resize: 'none' }}
        className="font-mono"
      />
    </div>
  );
};

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('members');

  const team = teams.find((t) => t.id === Number(id));

  if (!team) {
    return (
      <Page breadcrumb={<span className="text-faint">团队未找到</span>}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-muted mb-3">未找到该团队</p>
            <Button onClick={() => navigate('/team')}>返回列表</Button>
          </div>
        </div>
      </Page>
    );
  }

  const mainAgent = MOCK_MEMBERS.find((m) => m.isMain);

  return (
    <Page
      breadcrumb={
        <>
          <span
            className="text-faint cursor-pointer hover:text-ink"
            onClick={() => navigate('/team')}
          >
            Agent 团队
          </span>
          <span className="text-faint">/</span>
          <span className="text-ink font-medium">{team.name}</span>
        </>
      }
      extra={
        <Button type="text" danger>
          归档
        </Button>
      }
    >
      {/* Team info header */}
      <div className="px-6 py-4 border-b border-line">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 rounded-lg flex items-center justify-center text-xl bg-surface border border-line shrink-0">
            👥
          </div>
          <h1 className="text-lg font-bold text-ink m-0">{team.name}</h1>
          <Tag color="#1677ff">空间共享</Tag>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{team.desc}</p>
          <div className="text-xs text-faint shrink-0 ml-4">
            主 Agent: <span className="font-medium text-ink">{mainAgent?.name ?? '未指定'}</span>
            <span className="mx-1">·</span>
            {MOCK_MEMBERS.length} 名成员
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'members', label: '成员', children: <MembersTab members={MOCK_MEMBERS} /> },
          { key: 'instructions', label: '团队指令', children: <InstructionsTab /> },
        ]}
        className="px-6"
        tabBarStyle={{ marginBottom: 0 }}
      />
    </Page>
  );
};
export default TeamDetail;
