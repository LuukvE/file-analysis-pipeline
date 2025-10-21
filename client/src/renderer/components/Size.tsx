import { useMemo } from 'react';
import { ICellRendererParams } from 'ag-grid-community';

import { Row } from '../types';

const k = 1024;
const sizes = ['KB', 'MB', 'GB'];

export default function Size({ value = 0 }: ICellRendererParams<Row>) {
  const formatted = useMemo(() => {
    let v = value / k;
    let i = 0;

    while (v >= k && i < sizes.length - 1) {
      v /= k;
      i++;
    }

    return `${v.toFixed(2)} ${sizes[i]}`;
  }, [value]);

  return <>{formatted}</>;
}
