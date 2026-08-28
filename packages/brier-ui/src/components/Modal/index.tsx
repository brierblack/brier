import { obj } from '@/utils';
import { Modal as AntdModal, type ModalProps as AntdModalProps } from 'antd';
import { memo, useMemo } from 'react';

const DEFAULT_CLASS_NAMES = {
  container: '!max-h-[85dvh] !p-0 !flex !flex-col',
  header: '!p-4 !m-0 !border-b !border-b-ghost',
  body: '!min-h-0 !p-4 !overflow-y-auto !flex-1',
  footer: '!p-4 !border-t !border-t-ghost',
  wrapper: '!overflow-hidden',
};

export interface ModalProps extends AntdModalProps {}

export const Modal = memo((props: ModalProps) => {
  const { classNames = obj, ...rest } = props;
  const cns = useMemo(() => {
    return { ...DEFAULT_CLASS_NAMES, ...classNames };
  }, [classNames]);
  return <AntdModal centered width={720} destroyOnHidden classNames={cns} {...rest} />;
});
