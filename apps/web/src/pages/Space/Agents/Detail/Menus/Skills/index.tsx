import { useState } from 'react';
import { skills as allSkills } from '@/data/mockData';
import type { Skill } from '@/types';
import { Button, Tag } from '@brierb/brier-ui';
import { DeleteOutlined, PlusOutlined, ToolOutlined } from '@ant-design/icons';
import { SKILL_TYPE_MAP } from '@/define';

export const Skills = () => {
  const [boundSkills, setBoundSkills] = useState<Skill[]>(allSkills.filter((_, i) => i < 3));

  const handleRemove = (name: string) => {
    setBoundSkills((prev) => prev.filter((s) => s.name !== name));
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-standard font-bold">绑定的 Skills</div>
            <p className="mt-0.5 text-xs">该 Agent 可使用的技能</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>
            添加 Skill
          </Button>
        </div>
        <div className="divide-y divide-ghost overflow-hidden rounded-lg border border-ghost">
          {boundSkills.map((skill) => (
            <div key={skill.name} className="flex items-center gap-3 bg-white px-4 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md">
                <ToolOutlined className="text-standard" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-standard font-medium">{skill.name}</span>
                  <Tag color={SKILL_TYPE_MAP[skill.type].color}>
                    {skill.type === 'builtin' ? 'Plugin 内置' : SKILL_TYPE_MAP[skill.type].label}
                  </Tag>
                </div>
                <div className="mt-0.5 text-xs leading-relaxed">{skill.desc}</div>
              </div>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(skill.name)}
              />
            </div>
          ))}
          {boundSkills.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-standard">暂未绑定任何 Skill</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
