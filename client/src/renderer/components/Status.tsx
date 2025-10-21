import { ICellRendererParams } from 'ag-grid-community';
import { Row, Status as StatusOption } from '../types';

export default function Status({
  value = StatusOption.UPLOADING,
  data
}: ICellRendererParams<Row>) {
  if (value === StatusOption.UPLOADING && !data?.result) {
    return (
      <div className="flex items-center h-full">
        <div className="w-6 h-6 border-3 border-gray-200 rounded-full border-l-[#F4A261] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center h-full">
      <div className="w-6 h-6 border-3 border-[#58BC82] rounded-full flex items-center justify-center">
        <span className="text-[#58BC82] text-xl font-bold">&#10003;</span>
      </div>
    </div>
  );
}
