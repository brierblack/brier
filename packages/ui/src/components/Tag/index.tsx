import { Tag as AntdTag, type TagProps } from 'antd';
import { memo, useMemo } from 'react';

export const Tag = memo((props: TagProps) => {
  const { classNames, ...args } = props;
  const cn = useMemo(() => {
    return {
      root: '!text-xs !leading-5 !font-medium',
      ...classNames,
    };
  }, [classNames]);
  return <AntdTag classNames={cn} {...args} />;
});
