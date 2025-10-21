import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ICellRendererParams } from 'ag-grid-community';

import { Row } from '../types';

dayjs.extend(relativeTime);

export default function Time({ value }: ICellRendererParams<Row>) {
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(dayjs(value).fromNow());

    const interval = setInterval(() => {
      setTime(dayjs(value).fromNow());
    }, 1000);

    return () => clearInterval(interval);
  }, [value]);

  return <>{time}</>;
}
