import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOutlined, BgColorsOutlined, GlobalOutlined, LogoutOutlined } from '@ant-design/icons';
import { Avatar, Button, Select } from '@brierb/brier-ui';
import { useAuth } from '@/context/AuthContext';
import { Provider } from '@/components/Icon';

const userOptions = [
  {
    value: 'language',
    label: (
      <div className="flex items-center gap-2">
        <GlobalOutlined />
        <span>语言</span>
      </div>
    ),
    children: [
      {
        value: 'en',
        label: 'English',
      },
      {
        value: 'zh',
        label: '中文 (简体)',
      },
      {
        value: 'ja',
        label: '日本語',
      },
    ],
  },
  {
    value: 'theme',
    label: (
      <div className="flex items-center gap-2">
        <BgColorsOutlined />
        <span>主题</span>
      </div>
    ),
    children: [
      {
        value: 'light',
        label: '浅色',
      },
      {
        value: 'dark',
        label: '深色',
      },
    ],
  },
  {
    value: 'message',
    label: (
      <div className="flex items-center gap-2">
        <BellOutlined />
        <span>消息</span>
      </div>
    ),
  },
];

export const UserSetting = memo(() => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  return (
    <div>
      {user ? (
        <Select
          defaultValue="language"
          placement="topLeft"
          button={{ block: true, bordered: false, className: 'py-2.5! px-2!', size: 'large' }}
          labelRender={() => (
            <div className="flex w-full items-center gap-2.5">
              <Avatar size={26} src={user.avatar_url} className="shrink-0 rounded-md!" />
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium">{user.username}</div>
              </div>
              <Provider provider={user.provider} />
            </div>
          )}
          options={userOptions}
          onChange={(value) => {
            if (value === 'message') navigate('/space/message');
          }}
          footer={
            <Button
              className="flex! justify-start! gap-2! p-3!"
              block
              bordered={false}
              onClick={logout}
            >
              <LogoutOutlined className="text-standard" />
              退出登录
            </Button>
          }
        />
      ) : (
        <Button block onClick={() => navigate('/login')} className="flex items-center gap-2">
          请先登录
        </Button>
      )}
    </div>
  );
});
