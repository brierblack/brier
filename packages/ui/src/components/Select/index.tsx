import { Select as AntdSelect, type SelectProps as AntdSelectProps } from 'antd';
import { memo } from 'react';

export interface SelectProps extends AntdSelectProps {
  button?: boolean;
}

export const Select = memo((props: SelectProps) => {
  return <AntdSelect {...props} />;
});
