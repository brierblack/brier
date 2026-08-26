import { memo } from 'react';
import { Dropdown, type DropdownProps as AntdDropdownProps } from 'antd';
import { Button, type ButtonProps } from '../Button';

export interface ButtonSelectProps extends AntdDropdownProps {
  button: ButtonProps;
}

export const ButtonSelect = memo((props: ButtonSelectProps) => {
  const { button, ...rest } = props;
  return (
    <Dropdown {...rest}>
      <Button {...button} />
    </Dropdown>
  );
});
