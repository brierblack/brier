import { Card as AntdCard, type CardProps as AntdCardProps } from 'antd';
import { memo, useMemo } from 'react';

const DEFAULT_CLASS_NAMES = {
  root: '!border-line',
  header: '!border-b-line !px-4 !py-3',
  body: ' !px-4 !py-3',
};

export interface CardProps extends AntdCardProps {
  paddingless?: boolean;
}

export const Card = memo((props: CardProps) => {
  const { paddingless = false, classNames, ...rest } = props;
  const cn = useMemo(() => {
    return {
      ...DEFAULT_CLASS_NAMES,
      body: paddingless ? ' !p-0' : DEFAULT_CLASS_NAMES.body,
      ...classNames,
    };
  }, [paddingless, classNames]);
  return <AntdCard classNames={cn} {...rest} />;
});
