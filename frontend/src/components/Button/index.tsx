import { memo } from 'react';
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd/lib/button';

interface ButtonProps extends AntButtonProps {}

export const Button = memo((props: ButtonProps) => {
  const { children, classNames, ...rest } = props;
  return (
    <AntButton
      classNames={{
        root: ' !h-8',
        ...classNames,
      }}
      {...rest}
    >
      {children}
    </AntButton>
  );
});
