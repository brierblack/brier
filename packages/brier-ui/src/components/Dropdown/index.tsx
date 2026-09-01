import { memo, cloneElement, useMemo } from 'react';
import { Dropdown as AntdDropdown, type DropdownProps as AntdDropdownProps } from 'antd';
import { obj } from '@/utils';

const DEFAULT_CLASS_NAMES = { root: ' rounded-lg! border! border-ghost!' };

const DEFAULT_POPUP_CLASS_NAMES = ' bg-canvas! shadow-none! rounded-lg! border! border-ghost!';
const DEFAULT_SUB_POPUP_CLASS_NAMES = ' bg-canvas! shadow-none! rounded-lg! border! border-ghost!';
const DEFAULT_MENU_CLASS_NAMES =
  ' bg-transparent! shadow-none! bg-transparent! flex! flex-col! p-1! gap-0.5!';

export interface DropdownProps extends AntdDropdownProps {}

export const Dropdown = memo((props: DropdownProps) => {
  const { popupRender, classNames = obj, ...rest } = props;

  const cns = useMemo(() => {
    return {
      ...DEFAULT_CLASS_NAMES,
      ...classNames,
    };
  }, [classNames]);

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
  return <AntdDropdown classNames={cns} {...rest} />;
});
