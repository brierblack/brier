import { memo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Menu } from '@brierb/brier-ui';
import { getAgent } from '@/api/generated';
import { useRequest } from '@/hooks/useRequest';
import { useSpace } from '@/context/SpaceContext';
import { MENU_ITEMS } from './config';
import { Overview } from './Overview';
import { Session } from './Session';
import { History } from './History';
import { Skills } from './Skills';
import { Instructions } from './Instructions';
import { WorkDir } from './WorkDir';

export const Menus = memo(() => {
  const { id } = useParams();
  const { currentSpaceId } = useSpace();
  const [activeKey, setActiveKey] = useState('overview');

  const { data: agent, error } = useRequest(getAgent, [currentSpaceId, id]);

  if (error) {
    return 'Agent 不存在或已被删除';
  }

  if (!agent) {
    return '读取 Agent 配置中';
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-52 shrink-0 overflow-auto border-r border-ghost p-2">
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={({ key }) => setActiveKey(key)}
          items={MENU_ITEMS}
        />
      </div>
      <div className="flex-1">
        {activeKey === 'overview' && <Overview agent={agent} currentSpaceId={currentSpaceId} />}
        {activeKey === 'session' && <Session agent={agent} currentSpaceId={currentSpaceId} />}
        {activeKey === 'history' && <History />}
        {activeKey === 'skills' && <Skills />}
        {activeKey === 'instructions' && <Instructions />}
        {activeKey === 'workdir' && <WorkDir agent={agent} currentSpaceId={currentSpaceId} />}
      </div>
    </div>
  );
});
