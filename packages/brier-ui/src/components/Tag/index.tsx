import { obj } from '@/utils';
import { Tag as AntdTag, type TagProps as AntdTagProps } from 'antd';
import { memo, useMemo } from 'react';

const DEFAULT_CLASS_NAMES = {
  root: '!text-xs !leading-5 !font-medium !rounded-md',
};

export interface TagProps extends AntdTagProps {}

export const Tag = memo((props: TagProps) => {
  const { classNames = obj, ...args } = props;
  const cns = useMemo(() => {
    return {
      ...DEFAULT_CLASS_NAMES,
      ...classNames,
    };
  }, [classNames]);
  return <AntdTag classNames={cns} {...args} />;
});
