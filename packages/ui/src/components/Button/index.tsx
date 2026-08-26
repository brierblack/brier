import { memo, useMemo } from 'react';
import { Button as AntdButton, type ButtonProps as AntdButtonProps } from 'antd';

const DEFAULT_CLASS_NAMES = {
  root: ' hover:!bg-surface active:!bg-surface',
};

export interface ButtonProps extends AntdButtonProps {
  selected?: boolean;
  bordered?: boolean;
}

export const Button = memo((props: ButtonProps) => {
  const { type, selected = false, bordered = true, classNames = {}, ...rest } = props;
  const composeType = useMemo(() => {
    if (type === 'primary') {
      return 'primary';
    }
    return 'text';
  }, [type]);

  const cns = useMemo(() => {
    if (composeType === 'text') {
      if (selected) {
        DEFAULT_CLASS_NAMES.root += ' !bg-surface';
      }
      if (bordered) {
        DEFAULT_CLASS_NAMES.root += ' !border-ghost';
      }
      return {
        ...DEFAULT_CLASS_NAMES,
        ...classNames,
      };
    }
    return classNames;
  }, [composeType, selected, bordered, classNames]);
  return <AntdButton type={composeType} classNames={cns} {...rest} />;
});
