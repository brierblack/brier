import { memo, cloneElement } from 'react';
import { Dropdown as AntdDropdown, type DropdownProps as AntdDropdownProps } from 'antd';

const DEFAULT_CLASS_NAMES = { item: 'px-2! py-1! m-1!' };
const DEFAULT_POPUP_CLASS_NAMES =
  ' bg-canvas! shadow-none! rounded-lg! border! border-ghost! min-w-[320px]';
const DEFAULT_MENU_CLASS_NAMES = 'bg-transparent! shadow-none! bg-transparent! p-0!';

export interface DropdownProps extends AntdDropdownProps {}

export const Dropdown = memo((props: DropdownProps) => {
  const { popupRender, classNames, ...rest } = props;
  if (popupRender) {
    return (
      <AntdDropdown
        popupRender={(originNode) => {
          return (
            <div className={DEFAULT_POPUP_CLASS_NAMES}>
              {popupRender(
                cloneElement(originNode as React.ReactElement<{ className: string }>, {
                  className: DEFAULT_MENU_CLASS_NAMES,
                }),
              )}
            </div>
          );
        }}
        classNames={DEFAULT_CLASS_NAMES}
        {...rest}
      />
    );
  }
  return <AntdDropdown classNames={DEFAULT_CLASS_NAMES} {...rest} />;
});
