import React, { memo, useMemo } from 'react';
import { Table as AntdTable, type TableProps as AntdTableProps } from 'antd';

const DEFAULT_CLASS_NAMES = {
  root: ' !bg-transparent !border-t !border-x !border-ghost rounded-t-md',
};

type TableComponent = <T extends object = any>(props: AntdTableProps<T>) => React.ReactNode;

export const Table: TableComponent = memo((props) => {
  const { bordered, classNames = {}, ...args } = props;
  const cns = useMemo(() => {
    if (bordered) {
      return {
        ...DEFAULT_CLASS_NAMES,
        ...classNames,
      };
    }
    return classNames;
  }, [classNames, bordered]);
  return <AntdTable classNames={cns} {...args} />;
});
