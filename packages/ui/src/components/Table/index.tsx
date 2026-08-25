import React, { memo, useMemo } from 'react';
import { Table as AntdTable } from 'antd';

import type { TableProps } from 'antd/es/table';

// 定义泛型函数类型
type TableComponent = <T extends object = any>(props: TableProps<T>) => React.ReactNode;

export const Table: TableComponent = memo((props) => {
  const { bordered, classNames, ...args } = props;
  const cn = useMemo(() => {
    if (bordered) {
      return {
        root: ' !bg-transparent !border-t !border-x !border-line rounded-t-md',
        headerWrapper: ' !bg-[#f8f8f8]',
        ...classNames,
      };
    }
    return classNames;
  }, [classNames, bordered]);
  return <AntdTable classNames={cn} {...args} />;
});
