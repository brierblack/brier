import { memo, cloneElement } from 'react';
import { Dropdown as AntdDropdown, type DropdownProps as AntdDropdownProps } from 'antd';

const DEFAULT_POPUP_CLASS_NAMES = ' bg-canvas! shadow-none! rounded-lg! border! border-ghost!';
const DEFAULT_SUB_POPUP_CLASS_NAMES = ' bg-canvas! shadow-none! rounded-lg! border! border-ghost!';
const DEFAULT_MENU_CLASS_NAMES =
  ' bg-transparent! shadow-none! bg-transparent! flex! flex-col! p-1! gap-1!';

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
                cloneElement(
                  originNode as React.ReactElement<{
                    className: string;
                    classNames: { popup: string; 'subMenu.list': string };
                  }>,
                  {
                    className: DEFAULT_MENU_CLASS_NAMES,
                    classNames: {
                      popup: DEFAULT_SUB_POPUP_CLASS_NAMES,
                      'subMenu.list': DEFAULT_SUB_POPUP_CLASS_NAMES,
                    },
                  },
                ),
              )}
            </div>
          );
        }}
        {...rest}
      />
    );
  }
  return <AntdDropdown {...rest} />;
});
