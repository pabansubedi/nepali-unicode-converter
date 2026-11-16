import {useMemo, useState} from 'react';
import {Calendar, Clock, RefreshCw} from 'lucide-react';
import {
  AD_MONTHS_EN,
  adToBs,
  BS_END_YEAR,
  BS_MONTHS_EN,
  BS_MONTHS_NE,
  BS_START_YEAR,
  bsToAd,
  getBSMonthDays,
  type NepalClockState,
} from '../utils/nepaliDate';
import {toNepaliDigits} from '../utils/preetiEngine';
import {LiveNepalTime} from './LiveNepalTime';

interface DateTimePanelProps {
  clock: NepalClockState;
  lang: 'en' | 'ne';
}

export function DateTimePanel({clock, lang}: DateTimePanelProps) {
  // BS -> AD state
  const [bsYear, setBsYear] = useState<number>(clock.bs.year);
  const [bsMonth, setBsMonth] = useState<number>(clock.bs.month);
  const [bsDay, setBsDay] = useState<number>(clock.bs.day);

  // AD -> BS state
  const [adYear, setAdYear] = useState<number>(clock.adYear);
  const [adMonth, setAdMonth] = useState<number>(clock.adMonth);
  const [adDay, setAdDay] = useState<number>(clock.adDay);

  // BS Age calculator DOB
  const [dobBsYear, setDobBsYear] = useState<number>(2058);
  const [dobBsMonth, setDobBsMonth] = useState<number>(1);
  const [dobBsDay, setDobBsDay] = useState<number>(1);

  const bsMonthDaysList = useMemo(() => getBSMonthDays(bsYear), [bsYear]);
  const maxBsDay = bsMonthDaysList[bsMonth - 1] ?? 30;
  const clampedBsDay = Math.min(bsDay, maxBsDay);

  const convertedAd = useMemo(
    () => bsToAd(bsYear, bsMonth, clampedBsDay),
    [bsYear, bsMonth, clampedBsDay],
  );

  const maxAdDay = new Date(adYear, adMonth, 0).getDate();
  const clampedAdDay = Math.min(adDay, maxAdDay);

  const convertedBs = useMemo(
    () => adToBs(adYear, adMonth, clampedAdDay),
    [adYear, adMonth, clampedAdDay],
  );

  const dobMax = getBSMonthDays(dobBsYear)[dobBsMonth - 1] ?? 30;
  const clampedDobBsDay = Math.min(dobBsDay, dobMax);

  const ageDetails = useMemo(() => {
    const dobAd = bsToAd(dobBsYear, dobBsMonth, clampedDobBsDay);
    if (!dobAd) return null;

    const dobUtc = Date.UTC(dobAd.year, dobAd.month - 1, dobAd.day);
    const nowUtc = Date.UTC(clock.adYear, clock.adMonth - 1, clock.adDay);
    const totalDays = Math.floor((nowUtc - dobUtc) / (24 * 60 * 60 * 1000));
    if (totalDays < 0) return null;

    let years = clock.bs.year - dobBsYear;
    let months = clock.bs.month - dobBsMonth;
    let days = clock.bs.day - clampedDobBsDay;
    if (days < 0) {
      months -= 1;
      const prevMonthIdx = (clock.bs.month - 2 + 12) % 12;
      const prevMonthYear =
        clock.bs.month === 1 ? clock.bs.year - 1 : clock.bs.year;
      days += getBSMonthDays(prevMonthYear)[prevMonthIdx] ?? 30;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return {years, months, days, totalDays, dobAd};
  }, [dobBsYear, dobBsMonth, clampedDobBsDay, clock]);

  const jumpToToday = () => {
    setBsYear(clock.bs.year);
    setBsMonth(clock.bs.month);
    setBsDay(clock.bs.day);
    setAdYear(clock.adYear);
    setAdMonth(clock.adMonth);
    setAdDay(clock.adDay);
  };

  const bsYears = useMemo(() => {
    const arr: number[] = [];
    for (let y = BS_END_YEAR; y >= BS_START_YEAR; y -= 1) arr.push(y);
    return arr;
  }, []);

  const adYears = useMemo(() => {
    const arr: number[] = [];
    for (let y = 2033; y >= 1944; y -= 1) arr.push(y);
    return arr;
  }, []);

  return (
    <section
      id="date-time"
      aria-label="Nepali Date Converter and Live Nepal Time"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#0D131F]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {lang === 'ne'
              ? 'नेपाली मिति रूपान्तरण (BS ↔ AD) र समय'
              : 'Nepali Date Converter (BS ↔ AD) & Live Time'}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ne'
              ? 'विक्रम सम्वत् २००० देखि २०९० सम्मको सटीक पात्रो र नेपाल मानक समय (UTC+5:45)'
              : 'Verified Bikram Sambat calendar (2000–2090 BS) synced with Nepal Standard Time (UTC+5:45)'}
          </p>
        </div>

        <button
          type="button"
          onClick={jumpToToday}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{lang === 'ne' ? 'आजको मिति' : 'Reset to Today'}</span>
        </button>
      </div>

      {/* Unified Live Nepal Time & Today Summary */}
      <div className="mt-5 grid grid-cols-1 gap-5 rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/85 via-slate-50 to-rose-50/70 p-4 md:grid-cols-2 md:gap-0 md:divide-x md:divide-indigo-200/70 dark:border-indigo-900/60 dark:from-[#0C152B] dark:via-[#0D1322] dark:to-[#1C101B] dark:md:divide-slate-800">
        <div className="md:pr-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === 'ne' ? 'नेपालको वर्तमान समय (NPT)' : 'Nepal Standard Time (Asia/Kathmandu)'}</span>
          </div>
          <LiveNepalTime variant="panel" lang={lang} />
        </div>

        <div className="md:pl-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === 'ne' ? 'आजको नेपाली र अंग्रेजी मिति' : "Today's Nepali & English Date"}</span>
          </div>
          <div className="font-nepali mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {clock.bs.formattedNe}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            {clock.bs.formattedEn} <span aria-hidden="true">·</span>{' '}
            <span className="font-mono-tabular">
              {clock.adYear}-{String(clock.adMonth).padStart(2, '0')}-
              {String(clock.adDay).padStart(2, '0')} AD
            </span>
          </div>
        </div>
      </div>

      {/* BS -> AD and AD -> BS Converters */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* BS to AD */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {lang === 'ne' ? 'विक्रम सम्वत् → इस्वी सम्वत् (BS to AD)' : 'BS to AD Converter'}
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <label
                htmlFor="bs-year"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {lang === 'ne' ? 'वर्ष (BS)' : 'Year (BS)'}
              </label>
              <select
                id="bs-year"
                value={bsYear}
                onChange={(e) => setBsYear(Number(e.target.value))}
                className="font-mono-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {bsYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="bs-month"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {lang === 'ne' ? 'महिना' : 'Month'}
              </label>
              <select
                id="bs-month"
                value={bsMonth}
                onChange={(e) => setBsMonth(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {BS_MONTHS_EN.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {lang === 'ne' ? `${BS_MONTHS_NE[idx]} (${idx + 1})` : `${m} (${idx + 1})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="bs-day"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {lang === 'ne' ? 'गते' : 'Day'}
              </label>
              <select
                id="bs-day"
                value={clampedBsDay}
                onChange={(e) => setBsDay(Number(e.target.value))}
                className="font-mono-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {Array.from({length: maxBsDay}, (_, idx) => idx + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50/90 px-4 py-3 dark:bg-slate-950/70">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {lang === 'ne' ? 'इस्वी सम्वत् नतिजा' : 'Converted AD Date'}
            </div>
            <div className="mt-0.5 text-base font-bold text-red-700 dark:text-red-400">
              {convertedAd ? convertedAd.formattedEn : 'Out of range (2000–2090 BS)'}
            </div>
            {convertedAd && (
              <div className="font-nepali mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {toNepaliDigits(String(bsYear))} {BS_MONTHS_NE[bsMonth - 1]}{' '}
                {toNepaliDigits(String(clampedBsDay))}
              </div>
            )}
          </div>
        </div>

        {/* AD to BS */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {lang === 'ne' ? 'इस्वी सम्वत् → विक्रम सम्वत् (AD to BS)' : 'AD to BS Converter'}
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <label
                htmlFor="ad-year"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {lang === 'ne' ? 'वर्ष (AD)' : 'Year (AD)'}
              </label>
              <select
                id="ad-year"
                value={adYear}
                onChange={(e) => setAdYear(Number(e.target.value))}
                className="font-mono-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {adYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="ad-month"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {lang === 'ne' ? 'महिना' : 'Month'}
              </label>
              <select
                id="ad-month"
                value={adMonth}
                onChange={(e) => setAdMonth(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {AD_MONTHS_EN.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m.slice(0, 3)} ({idx + 1})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="ad-day"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {lang === 'ne' ? 'तारीख' : 'Day'}
              </label>
              <select
                id="ad-day"
                value={clampedAdDay}
                onChange={(e) => setAdDay(Number(e.target.value))}
                className="font-mono-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {Array.from({length: maxAdDay}, (_, idx) => idx + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50/90 px-4 py-3 dark:bg-slate-950/70">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {lang === 'ne' ? 'विक्रम सम्वत् नतिजा' : 'Converted BS Date'}
            </div>
            <div className="font-nepali mt-0.5 text-base font-bold text-red-700 dark:text-red-400">
              {convertedBs ? convertedBs.formattedNe : 'Out of range (1943–2033 AD)'}
            </div>
            {convertedBs && (
              <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {convertedBs.formattedEn}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BS Age Calculator */}
      <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {lang === 'ne'
              ? 'नेपाली जन्म मितिबाट उमेर गणना (BS Age Calculator)'
              : 'Nepali Age Calculator (From BS Birth Date)'}
          </h3>
          {ageDetails && (
            <span className="font-mono-tabular text-sm font-bold text-red-700 dark:text-red-400">
              {ageDetails.years}y {ageDetails.months}m {ageDetails.days}d ·{' '}
              {ageDetails.totalDays.toLocaleString()} days
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <div>
            <label
              htmlFor="dob-bs-year"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {lang === 'ne' ? 'जन्म वर्ष (BS)' : 'Birth Year (BS)'}
            </label>
            <select
              id="dob-bs-year"
              value={dobBsYear}
              onChange={(e) => setDobBsYear(Number(e.target.value))}
              className="font-mono-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {bsYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="dob-bs-month"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {lang === 'ne' ? 'जन्म महिना' : 'Birth Month'}
            </label>
            <select
              id="dob-bs-month"
              value={dobBsMonth}
              onChange={(e) => setDobBsMonth(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {BS_MONTHS_EN.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {lang === 'ne' ? BS_MONTHS_NE[idx] : m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="dob-bs-day"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {lang === 'ne' ? 'जन्म गते' : 'Birth Day'}
            </label>
            <select
              id="dob-bs-day"
              value={clampedDobBsDay}
              onChange={(e) => setDobBsDay(Number(e.target.value))}
              className="font-mono-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {Array.from({length: dobMax}, (_, idx) => idx + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg bg-slate-50/90 px-3 py-2 text-xs dark:bg-slate-950/70">
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'ne' ? 'AD जन्म मिति' : 'AD Equivalent'}
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {ageDetails ? ageDetails.dobAd.formattedEn : 'Invalid / Future Date'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
