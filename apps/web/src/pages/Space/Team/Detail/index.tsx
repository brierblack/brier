import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input, Segmented, Tooltip } from 'antd';
import { Button } from '@brierb/brier-ui';
import {
  PlusOutlined,
  LockOutlined,
  CheckOutlined,
  GlobalOutlined,
  ArrowLeftOutlined,
  RobotOutlined,
  TeamOutlined,
  FileTextOutlined,
  CrownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Page, Tag } from '@brierb/brier-ui';
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
      <div className="flex items-center justify-between gap-2">
        {SHARING_OPTIONS.map((opt) => (
          <div
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
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

const MembersTab = ({
  members,
  sharing,
  setSharing,
}: {
  members: MemberDetail[];
  sharing: string;
  setSharing: (v: string) => void;
}) => {
  return (
    <div className="overflow-auto p-4">
      <SharingScope selected={sharing} onSelect={setSharing} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-standard font-bold">团队成员</div>
            <p className="mt-0.5 text-xs">共 {members.length} 名成员，由主 Agent 负责协调</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>
            添加成员
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="group flex items-start gap-3 rounded-lg border border-ghost px-4 py-3 transition-colors hover:border-ghost"
            >
              <MemberAvatar icon={m.icon} color={m.color} />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-standard font-medium">{m.name}</span>
                  {m.isMain && <Tag color="#a855f7">主 Agent</Tag>}
                </div>
                <div>
                  {m.role ? (
                    <span className="cursor-pointer text-xs hover:text-brand">{m.role}</span>
                  ) : (
                    <span className="cursor-pointer text-xs hover:text-brand">添加角色…</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full" style={{ background: '#389e0d' }} />
                  <span>在线</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!m.isMain && (
                  <Tooltip title="设置为主 Agent">
                    <Button
                      type="text"
                      size="small"
                      icon={<CrownOutlined />}
                      className="text-muted hover:text-brand"
                    />
                  </Tooltip>
                )}
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="text-muted hover:text-red-500"
                  />
                </Tooltip>
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
    <div className="p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-standard font-bold">团队指令</span>
        <Button type="primary">保存</Button>
      </div>
      <p className="mb-4 text-xs">写给主 Agent 的协调规则、分工偏好和交付标准</p>
      <Input.TextArea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={20}
      />
    </div>
  );
};

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('members');
  const [sharing, setSharing] = useState('space');

  const team = teams.find((t) => t.id === Number(id));

  if (!team) {
    return (
      <Page header={<span className="">团队未找到</span>}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-standard">未找到该团队</p>
            <Button onClick={() => navigate('/space/team')}>返回列表</Button>
          </div>
        </div>
      </Page>
    );
  }

  const mainAgent = MOCK_MEMBERS.find((m) => m.isMain);
  const sharingOption = SHARING_OPTIONS.find((o) => o.value === sharing) ?? SHARING_OPTIONS[0];

  return (
    <Page
      header={
        <div className="flex items-center gap-3 py-2.5">
          <Button
            bordered={false}
            icon={
              <ArrowLeftOutlined
                className="shrink-0 cursor-pointer text-standard hover:text-brand"
                onClick={() => navigate('/space/team')}
              />
            }
          ></Button>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <img
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=A%20modern%20minimalist%20team%20workspace%20icon%20with%20aurora%20purple%20gradient%2C%20abstract%20geometric%20design%20representing%20collaboration%20and%20teamwork&image_size=square_hd"
                alt={team.name}
                className="size-7 shrink-0 rounded-md object-cover"
              />
              <h1 className="m-0 text-lg font-bold">{team.name}</h1>
              <Tag color="#a855f7">
                {sharing === 'space' ? <GlobalOutlined /> : <LockOutlined />}
                <span className="ml-1">{sharingOption.label}</span>
              </Tag>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-standard">{team.desc}</p>
              <div className="ml-4 flex shrink-0 items-center gap-1 text-xs">
                <RobotOutlined />
                <span>主 Agent:</span>
                <span className="font-medium">{mainAgent?.name ?? '未指定'}</span>
                <span className="mx-1">·</span>
                <TeamOutlined />
                <span>{MOCK_MEMBERS.length} 名成员</span>
              </div>
            </div>
          </div>
        </div>
      }
      extra={
        <Button type="text" danger>
          归档
        </Button>
      }
    >
      <div className="overflow-hidden">
        {/* Tabs */}
        <div className="px-4 pt-3">
          <Segmented
            value={activeTab}
            onChange={(value) => setActiveTab(value as string)}
            options={[
              { label: '成员', value: 'members', icon: <TeamOutlined /> },
              { label: '团队指令', value: 'instructions', icon: <FileTextOutlined /> },
            ]}
          />
        </div>
        {activeTab === 'members' && (
          <MembersTab members={MOCK_MEMBERS} sharing={sharing} setSharing={setSharing} />
        )}
        {activeTab === 'instructions' && <InstructionsTab />}
      </div>
    </Page>
  );
};
export default TeamDetail;
