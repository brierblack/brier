import type { ReactNode } from 'react';
import { type SelectProps as AntdSelectProps } from 'antd';
import type { BaseOptionType, DefaultOptionType } from 'antd/es/select';
import type { ButtonProps } from '../Button';

export interface SelectProps<
  T = any,
  P extends BaseOptionType | DefaultOptionType = DefaultOptionType,
> extends AntdSelectProps<T, P> {
  button?: ButtonProps;
}

export type SelectComponent = <
  T = any,
  P extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>(
  props: SelectProps<T, P>,
) => ReactNode;
