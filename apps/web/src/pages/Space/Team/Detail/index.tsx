import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Tabs } from 'antd';
import { PlusOutlined, LockOutlined, CheckOutlined } from '@ant-design/icons';
import { Page, Tag } from '@hiveblack/ui';
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
      className="flex shrink-0 items-center justify-center rounded-lg"
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
      <div className="mb-1 text-standard font-bold">共享范围</div>
      <p className="mb-3 text-xs">控制团队是否出现在空间成员的指派和 @ 列表中。</p>
      <div className="flex flex-col gap-2">
        {SHARING_OPTIONS.map((opt) => (
          <div
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
              selected === opt.value
                ? 'border-brand bg-[#fff5ed]'
                : 'border-ghost bg-white hover:border-ghost'
            }`}
          >
            {opt.value === 'private' && <LockOutlined className="text-standard" />}
            <div className="flex-1">
              <div className="text-standard font-medium">{opt.label}</div>
              <div className="mt-0.5 text-xs">{opt.desc}</div>
            </div>
            {selected === opt.value && <CheckOutlined className="text-standard text-brand" />}
          </div>
        ))}
      </div>
    </div>
  );
};

const MembersTab = ({ members }: { members: MemberDetail[] }) => {
  const [sharing, setSharing] = useState('space');

  return (
    <div className="max-w-3xl p-6">
      <SharingScope selected={sharing} onSelect={setSharing} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-standard font-bold">团队成员</div>
            <p className="mt-0.5 text-xs">
              共 {members.length} 名成员，由主 Agent 负责协调
            </p>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>
            添加成员
          </Button>
        </div>

        <div className="divide-y divide-ghost overflow-hidden rounded-lg border border-ghost">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-white px-4 py-3">
              <MemberAvatar icon={m.icon} color={m.color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-standard font-medium">{m.name}</span>
                  {m.isMain && <Tag color="#fe6e00">主 Agent</Tag>}
                  {m.role && !m.isMain && <Tag color="#8d54ff">{m.role}</Tag>}
                  {!m.role && !m.isMain && (
                    <span className="cursor-pointer text-xs hover:text-brand">
                      添加角色…
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ background: '#389e0d' }} />
                <span className="text-xs">在线</span>
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
    <div className="max-w-3xl p-6">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-standard font-bold">团队指令</span>
        <Button type="primary" size="small">
          保存
        </Button>
      </div>
      <p className="mb-4 text-xs">写给主 Agent 的协调规则、分工偏好和交付标准</p>
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
      <Page breadcrumb={<span className="">团队未找到</span>}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-standard">未找到该团队</p>
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
            className="cursor-pointer"
            onClick={() => navigate('/team')}
          >
            Agent 团队
          </span>
          <span className="">/</span>
          <span className="font-medium">{team.name}</span>
        </>
      }
      extra={
        <Button type="text" danger>
          归档
        </Button>
      }
    >
      {/* Team info header */}
      <div className="border-b border-ghost px-6 py-4">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-ghost text-xl">
            👥
          </div>
          <h1 className="m-0 text-lg font-bold">{team.name}</h1>
          <Tag color="#1677ff">空间共享</Tag>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-standard">{team.desc}</p>
          <div className="ml-4 shrink-0 text-xs">
            主 Agent: <span className="font-medium">{mainAgent?.name ?? '未指定'}</span>
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
