import {useEffect, useState} from 'react';
import {getNepalNow, type NepalClockState} from '../utils/nepaliDate';
import {toNepaliDigits} from '../utils/preetiEngine';

interface LiveNepalTimeProps {
  variant: 'hero' | 'panel';
  lang: 'en' | 'ne';
  liveCount?: number;
}

export function LiveNepalTime({variant, lang, liveCount}: LiveNepalTimeProps) {
  const [clock, setClock] = useState<NepalClockState>(() => getNepalNow());

  useEffect(() => {
    const id = window.setInterval(() => {
      setClock(getNepalNow());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (variant === 'hero') {
    const activeCount = liveCount ?? 58;
    const formattedCount =
      lang === 'ne' ? toNepaliDigits(String(activeCount)) : String(activeCount);

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/15">
        <div className="sm:pr-5">
          <div className="text-[11px] font-medium text-slate-300">
            {lang === 'ne' ? 'आजको नेपाली मिति (BS)' : "Today's Bikram Sambat Date"}
          </div>
          <div className="font-nepali mt-0.5 text-sm font-bold text-amber-300">
            {clock.bs.formattedNe}
          </div>
          <div className="text-[11px] text-slate-300/90">
            {clock.bs.formattedEn}
          </div>
        </div>

        <div className="sm:px-5">
          <div className="text-[11px] font-medium text-slate-300">
            {lang === 'ne' ? 'नेपाल मानक समय (NPT)' : 'Nepal Standard Time (NPT)'}
          </div>
          <div className="font-mono-tabular mt-0.5 text-sm font-bold text-sky-300">
            {clock.time12En}
          </div>
          <div className="font-nepali text-[11px] text-slate-300/90">
            {clock.time12Ne} <span aria-hidden="true">·</span>{' '}
            <span className="font-mono-tabular">{clock.time24En}</span>
          </div>
        </div>

        <div className="sm:pl-5" aria-live="polite">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            </span>
            <span>
              {lang === 'ne'
                ? 'अहिले सक्रिय प्रयोगकर्ता:'
                : 'Live users currently active:'}
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-mono-tabular text-base font-extrabold text-emerald-300">
              {formattedCount}
            </span>
            <span className="font-nepali text-xs font-semibold text-emerald-200/90">
              {lang === 'ne'
                ? 'जना अनलाइन'
                : activeCount === 1
                  ? 'user online now'
                  : 'users online now'}
            </span>
          </div>
          <div className="font-mono-tabular text-[11px] text-slate-300/90">
            {lang === 'ne'
              ? 'LIVE · तुरुन्त र स्वचालित अपडेट'
              : 'LIVE · Ctrl+K · Alt+0xxx Studio'}
          </div>
        </div>
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
