"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function TimeAgo({ date }: { date: Date }) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const update = () => {
      const formatted = formatDistanceToNow(date, { addSuffix: true, locale: es });
      setTimeAgo(formatted);
    };

    update();
    const intervalId = setInterval(update, 60000);

    return () => clearInterval(intervalId);
  }, [date]);

  return <span className="text-sm text-gray-500 whitespace-nowrap">{timeAgo}</span>;
}
