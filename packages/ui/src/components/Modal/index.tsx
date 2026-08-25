import { Modal as AntdModal, type ModalProps as AntdModalProps } from 'antd';
import { memo } from 'react';

export const Modal = memo((props: AntdModalProps) => {
  const { classNames, ...rest } = props;
  return (
    <AntdModal
      centered
      width={720}
      destroyOnHidden
      classNames={{
        container: '!p-0 !max-h-[85vh] !flex !flex-col',
        header: '!p-4 !border-b !border-b-line !m-0',
        body: '!p-4 !flex-1 !min-h-0 !overflow-y-auto',
        footer: '!p-4 !border-t !border-t-line',
        wrapper: '!overflow-hidden',
        ...classNames,
      }}
      {...rest}
    />
  );
});
