import { Card as AntdCard, type CardProps as AntdCardProps } from 'antd';
import { memo, useMemo } from 'react';

const DEFAULT_CLASS_NAMES = {
  root: '!border-line',
  header: '!border-b-line !p-4 !mb-0',
  body: ' !p-0',
};

export interface CardProps extends AntdCardProps {}

export const Card = memo((props: CardProps) => {
  const { classNames = {}, ...rest } = props;
  const cns = useMemo(() => {
    return {
      ...DEFAULT_CLASS_NAMES,
      ...classNames,
    };
  }, [classNames]);
  return <AntdCard classNames={cns} {...rest} />;
});
