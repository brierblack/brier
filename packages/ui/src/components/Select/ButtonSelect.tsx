import { memo, useMemo, useState, type ReactNode } from 'react';
import { Input, type MenuProps as AntdMenuProps } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Button } from '../Button';
import type { SelectComponent } from './definition';
import { Dropdown } from '../Dropdown';

export const ButtonSelect: SelectComponent = memo((props) => {
  const {
    options = [],
    value,
    defaultValue,
    onChange,
    showSearch,
    labelRender,
    button,
    notFoundContent,
    placeholder,
    disabled,
    open: controlledOpen,
    defaultOpen,
    onOpenChange,
    placement,
    header,
    footer,
  } = props;

  const [internalSearch, setInternalSearch] = useState('');
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const searchConfig = typeof showSearch === 'object' && showSearch !== null ? showSearch : null;
  const searchable = !!showSearch;
  const searchValue = searchConfig?.searchValue ?? internalSearch;
  const onSearch = searchConfig?.onSearch;
  const filterOption = searchConfig?.filterOption;

  const open = controlledOpen ?? internalOpen;

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? options.find((o) => o.value === defaultValue),
    [options, value, defaultValue],
  );

  const filtered = useMemo(() => {
    if (!searchable || !searchValue?.trim()) return options;
    const q = searchValue.trim();
    if (filterOption === false) return options;
    if (typeof filterOption === 'function') {
      return options.filter((o) => o.type === 'divider' || filterOption(q, o));
    }
    const ql = q.toLowerCase();
    return options.filter((o) => {
      if (o.type === 'divider') return true;
      const label = typeof o.label === 'string' ? o.label : '';
      return label.toLowerCase().includes(ql);
    });
  }, [options, searchable, searchValue, filterOption]);

  const menuItems: AntdMenuProps['items'] = useMemo(
    () =>
      filtered.map((o) =>
        o.type === 'divider'
          ? { type: 'divider' as const }
          : { key: String(o.value), label: o.label, children: o.children },
      ),
    [filtered],
  );

  const handleMenuClick: AntdMenuProps['onClick'] = ({ key }) => {
    const option = options.find((o) => String(o.value) === key);
    if (option) {
      onChange?.(option.value, option);
    }
    setInternalOpen(false);
    setInternalSearch('');
  };

  const handleSearch = (val: string) => {
    setInternalSearch(val);
    onSearch?.(val);
  };

  const handleOpenChange = (visible: boolean) => {
    setInternalOpen(visible);
    onOpenChange?.(visible);
    if (!visible) {
      setInternalSearch('');
    }
  };

  const dropdownContent = (menu: ReactNode) => (
    <div>
      {header && <div className="border-b border-ghost p-1">{header}</div>}
      {searchable && (
        <div className="border-b border-ghost p-1">
          <Input
            prefix={<SearchOutlined />}
            placeholder={'搜索'}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            variant="filled"
            classNames={{ root: 'bg-transparent! border-transparent! px-2! py-1!' }}
          />
        </div>
      )}
      {filtered.length > 0
        ? menu
        : notFoundContent && <div className="px-3 py-2">{notFoundContent}</div>}
      {footer && <div className="border-t border-ghost p-1">{footer}</div>}
    </div>
  );

  const triggerContent =
    selected && labelRender
      ? labelRender({ label: selected.label, value: selected.value })
      : ((selected?.label as ReactNode) ?? placeholder);

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      popupRender={dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={(visible) => handleOpenChange(visible)}
      disabled={disabled}
      placement={placement}
    >
      <Button {...button}>{triggerContent}</Button>
    </Dropdown>
  );
});
