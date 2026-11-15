import {toNepaliDigits} from './preetiEngine';

// Verified Bikram Sambat (BS) month lengths from 2000 BS to 2090 BS
// Anchor: 2000-01-01 BS == 1943-04-14 AD
export const BS_START_YEAR = 2000;
export const BS_END_YEAR = 2090;

const BS_MONTH_DAYS: Record<number, number[]> = {
  2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2047: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2049: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2051: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2056: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2084: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2085: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2086: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2087: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2088: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2089: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2090: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
};

export const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export const BS_MONTHS_NE = [
  'वैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुस',
  'माघ',
  'फागुन',
  'चैत',
];

export const AD_MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WEEKDAYS_NE = [
  'आइतबार',
  'सोमबार',
  'मंगलबार',
  'बुधबार',
  'बिहिबार',
  'शुक्रबार',
  'शनिबार',
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ANCHOR_AD_UTC = Date.UTC(1943, 3, 14); // 1943-04-14 == 2000-01-01 BS

export interface BSDate {
  year: number;
  month: number; // 1..12
  day: number; // 1..32
  weekday: number; // 0=Sunday..6=Saturday
  monthNameEn: string;
  monthNameNe: string;
  weekdayEn: string;
  weekdayNe: string;
  formattedEn: string;
  formattedNe: string;
}

export interface ADDate {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  weekday: number;
  monthNameEn: string;
  weekdayEn: string;
  formattedEn: string;
}

export function getBSMonthDays(bsYear: number): number[] {
  return BS_MONTH_DAYS[bsYear] ?? BS_MONTH_DAYS[2083];
}

export function adToBs(adYear: number, adMonth: number, adDay: number): BSDate | null {
  const targetUtc = Date.UTC(adYear, adMonth - 1, adDay);
  let remainingDays = Math.round((targetUtc - ANCHOR_AD_UTC) / MS_PER_DAY);
  if (remainingDays < 0) return null;

  let bsYear = BS_START_YEAR;
  while (bsYear <= BS_END_YEAR) {
    const months = BS_MONTH_DAYS[bsYear];
    const yearTotal = months.reduce((acc, d) => acc + d, 0);
    if (remainingDays < yearTotal) {
      let bsMonth = 1;
      for (const mDays of months) {
        if (remainingDays < mDays) {
          const bsDay = remainingDays + 1;
          const weekday = new Date(targetUtc).getUTCDay();
          const monthNameEn = BS_MONTHS_EN[bsMonth - 1];
          const monthNameNe = BS_MONTHS_NE[bsMonth - 1];
          const weekdayEn = WEEKDAYS_EN[weekday];
          const weekdayNe = WEEKDAYS_NE[weekday];
          return {
            year: bsYear,
            month: bsMonth,
            day: bsDay,
            weekday,
            monthNameEn,
            monthNameNe,
            weekdayEn,
            weekdayNe,
            formattedEn: `${monthNameEn} ${bsDay}, ${bsYear} BS (${weekdayEn})`,
            formattedNe: `${toNepaliDigits(String(bsYear))} ${monthNameNe} ${toNepaliDigits(String(bsDay))}, ${weekdayNe}`,
          };
        }
        remainingDays -= mDays;
        bsMonth += 1;
      }
    }
    remainingDays -= yearTotal;
    bsYear += 1;
  }
  return null;
}

export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): ADDate | null {
  if (bsYear < BS_START_YEAR || bsYear > BS_END_YEAR) return null;
  if (bsMonth < 1 || bsMonth > 12) return null;
  const monthDays = BS_MONTH_DAYS[bsYear][bsMonth - 1];
  if (bsDay < 1 || bsDay > monthDays) return null;

  let totalDays = 0;
  for (let y = BS_START_YEAR; y < bsYear; y += 1) {
    totalDays += BS_MONTH_DAYS[y].reduce((acc, d) => acc + d, 0);
  }
  for (let m = 0; m < bsMonth - 1; m += 1) {
    totalDays += BS_MONTH_DAYS[bsYear][m];
  }
  totalDays += bsDay - 1;

  const targetUtc = ANCHOR_AD_UTC + totalDays * MS_PER_DAY;
  const d = new Date(targetUtc);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const weekday = d.getUTCDay();

  return {
    year,
    month,
    day,
    weekday,
    monthNameEn: AD_MONTHS_EN[month - 1],
    weekdayEn: WEEKDAYS_EN[weekday],
    formattedEn: `${AD_MONTHS_EN[month - 1]} ${day}, ${year} (${WEEKDAYS_EN[weekday]})`,
  };
}

export interface NepalClockState {
  hours24: number;
  minutes: number;
  seconds: number;
  time12En: string;
  time24En: string;
  time12Ne: string;
  periodNe: string;
  adYear: number;
  adMonth: number;
  adDay: number;
  bs: BSDate;
}

export function getNepalNow(now: Date = new Date()): NepalClockState {
  // Nepal Standard Time (NPT) = UTC + 5 hours 45 minutes (no DST)
  const nptMs = now.getTime() + (5 * 60 + 45) * 60 * 1000;
  const npt = new Date(nptMs);

  const adYear = npt.getUTCFullYear();
  const adMonth = npt.getUTCMonth() + 1;
  const adDay = npt.getUTCDate();

  const hours24 = npt.getUTCHours();
  const minutes = npt.getUTCMinutes();
  const seconds = npt.getUTCSeconds();

  const pad = (n: number) => String(n).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const h12 = hours24 % 12 || 12;

  let periodNe = 'राति';
  if (hours24 >= 4 && hours24 < 12) periodNe = 'बिहान';
  else if (hours24 >= 12 && hours24 < 17) periodNe = 'दिउँसो';
  else if (hours24 >= 17 && hours24 < 20) periodNe = 'साँझ';

  const time12En = `${pad(h12)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
  const time24En = `${pad(hours24)}:${pad(minutes)}:${pad(seconds)}`;
  const time12Ne = `${periodNe} ${toNepaliDigits(`${pad(h12)}:${pad(minutes)}:${pad(seconds)}`)}`;

  const bs =
    adToBs(adYear, adMonth, adDay) ??
    ({
      year: 2083,
      month: 7,
      day: 29,
      weekday: 0,
      monthNameEn: 'Kartik',
      monthNameNe: 'कार्तिक',
      weekdayEn: 'Sunday',
      weekdayNe: 'आइतबार',
      formattedEn: 'Kartik 29, 2083 BS (Sunday)',
      formattedNe: '२०८३ कार्तिक २९, आइतबार',
    } as BSDate);

  return {
    hours24,
    minutes,
    seconds,
    time12En,
    time24En,
    time12Ne,
    periodNe,
    adYear,
    adMonth,
    adDay,
    bs,
  };
}
