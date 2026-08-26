import { memo, useMemo } from 'react';
import { Button as AntdButton, type ButtonProps as AntdButtonProps } from 'antd';

const DEFAULT_CLASS_NAMES = {
  root: ' hover:!bg-surface-hover active:!bg-surface-hover',
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
      let root = DEFAULT_CLASS_NAMES.root;
      if (selected) {
        root = `${root} !bg-surface-hover`;
      }
      if (bordered) {
        root = `${root} !border-ghost`;
      }
      return {
        ...{ root },
        ...classNames,
      };
    }
    return classNames;
  }, [composeType, selected, bordered, classNames]);
  return <AntdButton type={composeType} classNames={cns} {...rest} />;
});
