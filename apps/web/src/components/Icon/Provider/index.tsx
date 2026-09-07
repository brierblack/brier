import { memo } from 'react';
import { GitHub } from '../GitHub';
import { GitLab } from '../GitLab';
import { Gitee } from '../Gitee';
import type { IconProps } from '../definition';
import { Logo } from '@/components/Logo';

/** OAuth provider key → 品牌图标（与后端 user_identities.provider 对齐）。 */
const BRAND_ICONS = {
  github: GitHub,
  gitlab: GitLab,
  gitee: Gitee,
} as const;

interface ProviderProps extends IconProps {
  provider?: string | null;
  size?: number;
}

/** 按 provider 展示对应第三方登录品牌图标；未知/未绑定（本地账户）不渲染。 */
export const Provider = memo(({ provider, size = 16, ...props }: ProviderProps) => {
  const Brand = provider ? BRAND_ICONS[provider as keyof typeof BRAND_ICONS] : undefined;
  if (Brand) return <Brand size={size} {...props} />;
  return <Logo size={size} {...props} />;
});
