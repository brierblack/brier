import { Drawer as AntdDrawer, type DrawerProps as AntdDrawerProps } from 'antd';
import { memo, useMemo } from 'react';

const DEFAULT_CLASS_NAMES = {
  header: '!h-12 !py-0 !px-4 !border-b-line !flex-none',
};

export interface DrawerProps extends AntdDrawerProps {}

export const Drawer = memo((props: DrawerProps) => {
  const { classNames = {}, ...rest } = props;
  const cns = useMemo(() => {
    return {
      ...DEFAULT_CLASS_NAMES,
      ...classNames,
    };
  }, [classNames]);
  return <AntdDrawer classNames={cns} {...rest} />;
});
