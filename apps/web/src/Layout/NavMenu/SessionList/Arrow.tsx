import { memo } from 'react';
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';

export const Arrow = memo(({ expanded }: { expanded: boolean }) => {
  return expanded ? (
    <CaretDownOutlined className="text-[10px]" />
  ) : (
    <CaretRightOutlined className="text-[10px]" />
  );
});
