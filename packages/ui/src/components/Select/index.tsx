import { memo } from 'react';
import { Select as AntdSelect, type SelectProps as AntdSelectProps } from 'antd';
import type { ButtonProps } from '../Button';
import { ButtonSelect, type ButtonSelectProps } from './ButtonSelect';

const isButtonSelect = (props: SelectProps | ButtonSelectProps): props is ButtonSelectProps =>
  typeof props.button === 'object';

export interface SelectProps extends AntdSelectProps {
  button?: ButtonProps;
}

export const Select = memo((props: SelectProps | ButtonSelectProps) => {
  if (isButtonSelect(props)) {
    return <ButtonSelect {...props} />;
  }
  return <AntdSelect {...props} />;
});
