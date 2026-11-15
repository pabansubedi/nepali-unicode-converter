import {useEffect, useState} from 'react';
import {getNepalNow, type NepalClockState} from '../utils/nepaliDate';

interface LiveNepalTimeProps {
  variant: 'hero' | 'panel';
  lang: 'en' | 'ne';
}

export function LiveNepalTime({variant, lang}: LiveNepalTimeProps) {
  const [clock, setClock] = useState<NepalClockState>(() => getNepalNow());

  useEffect(() => {
    const id = window.setInterval(() => {
      setClock(getNepalNow());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (variant === 'hero') {
    return (
      <div className="font-nepali mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-red-700 dark:text-red-400">
          {clock.bs.formattedNe}
        </span>
        <span aria-hidden="true">·</span>
        <span>{clock.bs.formattedEn}</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono-tabular font-semibold text-slate-800 dark:text-slate-200">
          NPT {clock.time12En}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="font-mono-tabular mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {clock.time12En}
      </div>
      <div className="font-nepali mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
        {clock.time12Ne} <span aria-hidden="true">·</span>{' '}
        <span>{lang === 'ne' ? '२४ घण्टे' : '24h'}</span>{' '}
        <span className="font-mono-tabular">{clock.time24En}</span>
      </div>
    </>
  );
}
