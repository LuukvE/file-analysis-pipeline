import { ICellRendererParams } from 'ag-grid-community';
import { Row } from '../types';
import { useMemo } from 'react';

export default function Progress({ value = 0, data }: ICellRendererParams<Row>) {
  const percent = useMemo(() => {
    const bytes = value * 31457280;
    const total = data?.size || 1;

    if (data?.result) return 100;

    return Math.min(100, (bytes / total) * 100);
  }, [data?.result, data?.size, value]);

  return (
    <div className="flex items-center">
      <div className="h-1 w-full overflow-hidden rounded bg-gray-200">
        <span className="block h-full bg-[#F4A261]" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 pl-2">{Math.round(percent)}%</span>
    </div>
  );
}
