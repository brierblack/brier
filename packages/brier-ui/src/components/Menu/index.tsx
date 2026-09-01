import { memo, useMemo } from 'react';
import { Menu as AntdMenu, type MenuProps as AntdMenuProps } from 'antd';
import { obj } from '@/utils';

const DEFAULT_CLASS_NAMES = {
  root: ' !border-none !grid !gap-0.5 !bg-transparent',
  item: ' !px-2 !m-0 !h-8 !leading-8 !text-standard !w-full',
  itemTitle: ' px-2!',
  list: ' grid! gap-0.5!',
};

export interface MenuProps extends AntdMenuProps {}

export const Menu = memo((props: MenuProps) => {
  const { classNames = obj, ...rest } = props;
  const cns = useMemo(() => {
    return {
      ...DEFAULT_CLASS_NAMES,
      ...classNames,
    };
  }, [classNames]);
  return <AntdMenu classNames={cns} {...rest} />;
});
