import { memo } from 'react';
import { Select as AntdSelect } from 'antd';
import type { SelectComponent } from './definition';
import { ButtonSelect } from './ButtonSelect';

export const Select: SelectComponent = memo((props) => {
  const { button, ...rest } = props;
  if (typeof button === 'object') {
    return <ButtonSelect {...props} />;
  }
  return <AntdSelect {...rest} />;
});
