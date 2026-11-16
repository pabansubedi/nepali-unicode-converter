import {useEffect, useMemo, useState} from 'react';
import {flushSync} from 'react-dom';
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Menu,
  Moon,
  Printer,
  Share2,
  Sun,
  X,
} from 'lucide-react';
import {
  ConverterWorkspace,
  type WorkspaceMode,
} from './components/ConverterWorkspace';
import {DateTimePanel} from './components/DateTimePanel';
import {GuideAndFaq} from './components/GuideAndFaq';
import {LiveNepalTime} from './components/LiveNepalTime';
import {RecentConversionsPanel} from './components/RecentConversionsPanel';
import {useLivePresence} from './hooks/useLivePresence';
import {
  type HistoryItem,
  loadConversionHistory,
  saveConversionHistory,
  upsertConversionHistory,
} from './utils/conversionHistory';
import {getNepalNow, type NepalClockState} from './utils/nepaliDate';
import {numberToNepaliWords} from './utils/nepaliNumbers';
import {toEnglishDigits, toNepaliDigits} from './utils/preetiEngine';

export default function App() {
  const [mode, setMode] = useState<WorkspaceMode>('preeti-to-unicode');
  const [lang, setLang] = useState<'en' | 'ne'>(() => {
    try {
      return localStorage.getItem('nus_lang') === 'en' ? 'en' : 'ne';
    } catch {
      return 'ne';
    }
  });
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nus_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
      );
    } catch {
      return false;
    }
  });
  const [todayClock, setTodayClock] = useState<NepalClockState>(() => getNepalNow());
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [quickNumInput, setQuickNumInput] = useState<string>('125000');
  const [copiedWords, setCopiedWords] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>(
    'idle',
  );
  const [printText, setPrintText] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    loadConversionHistory(),
  );
  const [restoreRequest, setRestoreRequest] = useState<{
    item: HistoryItem;
    nonce: number;
  } | null>(null);
  const livePresence = useLivePresence();

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [dark]);

  const handleToggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nus_theme', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem('nus_lang', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  // Only refresh app-level date state on day rollover (midnight NPT) instead of every second
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = getNepalNow();
      setTodayClock((prev) =>
        prev.bs.formattedEn === next.bs.formattedEn ? prev : next,
      );
    }, 60000);
    return () => window.clearInterval(id);
  }, []);

  const quickNepaliDigits = useMemo(
    () => toNepaliDigits(quickNumInput),
    [quickNumInput],
  );
  const quickEnglishDigits = useMemo(
    () => toEnglishDigits(quickNumInput),
    [quickNumInput],
  );
  const numberWords = useMemo(
    () => numberToNepaliWords(quickNumInput),
    [quickNumInput],
  );

  const handleCopyWords = async () => {
    const text = lang === 'ne' ? numberWords.ne : numberWords.en;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWords(true);
      window.setTimeout(() => setCopiedWords(false), 1600);
    } catch {
      // ignore
    }
  };

  const handleShareSite = async () => {
    const shareUrl =
      typeof window !== 'undefined' && window.location.href
        ? window.location.href
        : 'https://unicode.pabansubedi.com.np/';
    const shareTitle =
      lang === 'ne'
        ? 'नेपाली युनिकोड र प्रीति कन्भर्टर'
        : 'Nepali Unicode & Preeti Font Converter';
    const shareDescription =
      lang === 'ne'
        ? 'Preeti, Kantipur, Romanized Nepali रूपान्तरण तथा नेपाली मिति र समय।'
        : 'Convert Preeti, Kantipur, and Romanized Nepali to Unicode with BS-AD Nepali Date & Time.';

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
        setShareStatus('shared');
        window.setTimeout(() => setShareStatus('idle'), 2000);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        // Fall back to copying URL below if share failed
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('copied');
      window.setTimeout(() => setShareStatus('idle'), 2000);
    } catch {
      // ignore
    }
  };

  const handlePrintOutput = (text: string) => {
    if (!text.trim()) return;
    flushSync(() => {
      setPrintText(text);
      setShowPrintModal(true);
    });
    try {
      window.print();
    } catch {
      // Fallback Print Preview modal remains open so user can download print-ready HTML or retry
    }
  };

  const handleDownloadPrintableHtml = () => {
    if (!printText.trim()) return;
    const escaped = printText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const html = `<!doctype html>
<html lang="ne">
<head>
<meta charset="utf-8" />
<title>Nepali Document - unicode.pabansubedi.com.np</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: "Noto Sans Devanagari", "Mangal", Arial, sans-serif; color: #0f172a; line-height: 1.85; font-size: 13pt; margin: 0; padding: 24px; }
  .content { white-space: pre-wrap; }
  .meta { margin-top: 28px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 9pt; color: #64748b; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="content">${escaped}</div>
  <div class="meta">${todayClock.bs.formattedNe} · ${todayClock.bs.formattedEn} · unicode.pabansubedi.com.np</div>
  <script>window.onload = function(){ try { window.print(); } catch(e){} };</script>
</body>
</html>`;
    const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nepali-print-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveHistory = (nextItem: HistoryItem) => {
    setHistory((prev) => {
      const updated = upsertConversionHistory(prev, nextItem);
      saveConversionHistory(updated);
      return updated;
    });
  };

  const handleRemoveHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveConversionHistory(updated);
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveConversionHistory([]);
  };

  const handleRestoreHistoryItem = (item: HistoryItem) => {
    setRestoreRequest({item, nonce: Date.now()});
    const el = document.getElementById('converter');
    el?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  return (
    <>
      <div className="min-h-screen bg-[#EEF2FA] text-slate-900 transition-colors print:hidden dark:bg-[#050811] dark:text-slate-100">
        {/* Vibrant Top Accent Hairline + 3-Zone Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/90 dark:bg-[#0A101D]/90">
          <div className="h-[3px] w-full bg-gradient-to-r from-red-600 via-indigo-600 to-amber-500" />
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-4 py-3 sm:px-6">
            {/* Zone 1: Single-line Brand Wordmark */}
            <a
              href="#top"
              className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white"
            >
              <span
                aria-hidden="true"
                className="font-nepali inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-rose-700 text-sm font-bold text-white shadow-xs"
              >
                अ
              </span>
              <span>Nepali Unicode</span>
            </a>

            {/* Zone 2: Concise single-line nav links */}
            <nav
              aria-label="Primary Navigation"
              className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300"
            >
              <a
                href="#converter"
                className="whitespace-nowrap shrink-0 hover:text-red-700 hover:underline underline-offset-4 dark:hover:text-red-400"
              >
                {lang === 'ne' ? 'कन्भर्टर' : 'Converter'}
              </a>
              <a
                href="#date-time"
                className="whitespace-nowrap shrink-0 hover:text-red-700 hover:underline underline-offset-4 dark:hover:text-red-400"
              >
                {lang === 'ne' ? 'नेपाली मिति' : 'Date & Time'}
              </a>
              <a
                href="#number-words"
                className="whitespace-nowrap shrink-0 hover:text-red-700 hover:underline underline-offset-4 dark:hover:text-red-400"
              >
                {lang === 'ne' ? 'अंक र शब्द' : 'Number Tools'}
              </a>
              <a
                href="#typing-guide"
                className="whitespace-nowrap shrink-0 hover:text-red-700 hover:underline underline-offset-4 dark:hover:text-red-400"
              >
                {lang === 'ne' ? 'टाइपिङ गाइड' : 'Typing Guide'}
              </a>
              <a
                href="#faq"
                className="whitespace-nowrap shrink-0 hover:text-red-700 hover:underline underline-offset-4 dark:hover:text-red-400"
              >
                {lang === 'ne' ? 'प्रश्नोत्तर' : 'FAQ'}
              </a>
            </nav>

            {/* Zone 3: Compact Top Live Indicator + Share Action + Mobile Menu Trigger */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                aria-live="polite"
                title={
                  lang === 'ne'
                    ? 'अहिले सक्रिय प्रयोगकर्ता'
                    : 'Live users currently active'
                }
                className="inline-flex min-h-[36px] items-center gap-2 whitespace-nowrap rounded-lg border border-emerald-500/25 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-80" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono-tabular font-bold">
                  {lang === 'ne'
                    ? toNepaliDigits(String(livePresence.count))
                    : livePresence.count}
                </span>
                <span className="hidden sm:inline">
                  {lang === 'ne' ? 'सक्रिय' : 'Live'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleShareSite}
                aria-label={lang === 'ne' ? 'वेबसाइट सेयर गर्नुहोस्' : 'Share website'}
                className={`inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
                  shareStatus !== 'idle'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
              >
                {shareStatus !== 'idle' ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>
                  {shareStatus === 'shared'
                    ? lang === 'ne'
                      ? 'सेयर भयो!'
                      : 'Shared!'
                    : shareStatus === 'copied'
                      ? lang === 'ne'
                        ? 'लिंक कपी भयो!'
                        : 'Link Copied!'
                      : lang === 'ne'
                        ? 'सेयर गर्नुहोस्'
                        : 'Share'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Navigation */}
          {mobileMenuOpen && (
            <nav
              aria-label="Mobile Navigation"
              className="border-t border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="grid grid-cols-2 gap-2 text-sm font-medium">
                <a
                  href="#converter"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-lg px-3 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {lang === 'ne' ? 'कन्भर्टर' : 'Converter'}
                </a>
                <a
                  href="#date-time"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-lg px-3 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {lang === 'ne' ? 'नेपाली मिति' : 'Date & Time'}
                </a>
                <a
                  href="#number-words"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-lg px-3 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {lang === 'ne' ? 'अंक र शब्द' : 'Number Tools'}
                </a>
                <a
                  href="#typing-guide"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-lg px-3 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {lang === 'ne' ? 'टाइपिङ गाइड' : 'Typing Guide'}
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="col-span-2 flex min-h-[44px] items-center rounded-lg px-3 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {lang === 'ne' ? 'प्रश्नोत्तर (FAQ)' : 'FAQ'}
                </a>
              </div>
            </nav>
          )}
        </header>

        <main id="top" className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-7">
          {/* Vibrant Himalayan Indigo-Crimson Studio Hero Header */}
          <section className="mb-6 rounded-2xl border border-indigo-950/60 bg-gradient-to-br from-[#0F172A] via-[#17213B] to-[#30101D] p-5 text-white shadow-md sm:p-6 dark:border-slate-800">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <h1 className="font-nepali text-balance text-2xl font-extrabold tracking-tight text-white sm:text-[32px] sm:leading-[1.2]">
                  {lang === 'ne'
                    ? 'प्रीति र नेपाली युनिकोड स्टुडियो'
                    : 'Preeti to Unicode & Nepali Font Studio'}
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                  {lang === 'ne'
                    ? 'Preeti, Kantipur, Sagarmatha, Himali, PCS Nepali र Romanized बाट तुरुन्त युनिकोड रूपान्तरण, Alt+0xxx सर्टकट तथा नेपाली मिति।'
                    : 'Convert Preeti, Kantipur, Sagarmatha, Himali, PCS Nepali, and Romanized typing to Unicode Devanagari with Alt+0xxx shortcuts & BS-AD tools.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div
                  role="group"
                  aria-label="Language toggle"
                  className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 p-1 backdrop-blur-xs"
                >
                  <button
                    type="button"
                    onClick={() => setLang('ne')}
                    className={`min-h-[34px] rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      lang === 'ne'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    नेपाली
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`min-h-[34px] rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      lang === 'en'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleToggleTheme}
                  aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                >
                  {dark ? (
                    <Sun className="h-4 w-4 text-amber-300" aria-hidden="true" />
                  ) : (
                    <Moon className="h-4 w-4 text-sky-300" aria-hidden="true" />
                  )}
                  <span>
                    {dark
                      ? lang === 'ne'
                        ? 'उज्यालो'
                        : 'Light'
                      : lang === 'ne'
                        ? 'अँध्यारो'
                        : 'Dark'}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-4 border-t border-white/15 pt-3.5">
              <LiveNepalTime
                variant="hero"
                lang={lang}
                liveCount={livePresence.count}
              />
            </div>
          </section>

          {/* Responsive 2-Column Layout: Primary Content + Sidebar */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Primary Workspace Column */}
            <div className="min-w-0 flex-1 space-y-6">
              <ConverterWorkspace
                mode={mode}
                onModeChange={setMode}
                lang={lang}
                bsDateText={todayClock.bs.formattedNe}
                onSaveHistory={handleSaveHistory}
                restoreRequest={restoreRequest}
                onPrintOutput={handlePrintOutput}
                onToggleTheme={handleToggleTheme}
                onToggleLang={() => setLang((prev) => (prev === 'ne' ? 'en' : 'ne'))}
              />

              <DateTimePanel clock={todayClock} lang={lang} />

              <GuideAndFaq
                lang={lang}
                showPrivacyModal={showPrivacyModal}
                onClosePrivacyModal={() => setShowPrivacyModal(false)}
              />
            </div>

            {/* Dedicated Clean Right Sidebar */}
            <div className="w-full shrink-0 space-y-5 lg:w-[320px] xl:w-[336px] lg:sticky lg:top-20">
              {/* Personal Website Signature Card (pabansubedi.com.np) */}
              <section
                aria-label="Personal Website"
                className="rounded-2xl border border-indigo-900/50 bg-gradient-to-br from-[#161B33] via-[#1E1B4B] to-[#3B0D1E] p-5 text-white shadow-md dark:border-indigo-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-700 text-xs font-bold tracking-tight text-white shadow-sm"
                  >
                    PS
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold tracking-tight text-white">
                      {lang === 'ne' ? 'पवन सुवेदी' : 'Paban Subedi'}
                    </h2>
                    <p className="font-mono-tabular text-xs font-medium text-indigo-200">
                      pabansubedi.com.np
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-300">
                  {lang === 'ne'
                    ? 'अन्य उपयोगी वेब टुल, प्रोजेक्ट र लेखहरूको लागि व्यक्तिगत वेबसाइट हेर्नुहोस्।'
                    : 'Explore more web tools, projects, and articles on my personal website.'}
                </p>
                <a
                  href="https://pabansubedi.com.np"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>
                    {lang === 'ne'
                      ? 'pabansubedi.com.np खोल्नुहोस्'
                      : 'Visit pabansubedi.com.np'}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </section>

              {/* Sidebar Utility: Digit Converter & Number to Nepali/English Words */}
              <section
                id="number-words"
                aria-label="Nepali Digit and Number to Words Converter"
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0D131F]"
              >
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  {lang === 'ne'
                    ? 'अंक र अक्षर रूपान्तरण (०-९ / शब्द)'
                    : 'Digit & Number-to-Words Tool'}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ne'
                    ? 'रकम, अंक वा मिति टाइप गर्नुहोस्:'
                    : 'Enter any number, amount, or date:'}
                </p>
                <input
                  type="text"
                  value={quickNumInput}
                  onChange={(e) => setQuickNumInput(e.target.value)}
                  aria-label="Quick numeral converter input"
                  className="font-mono-tabular mt-2.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100 text-xs dark:divide-slate-800 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 py-2.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      {lang === 'ne' ? 'नेपाली अंक:' : 'Nepali:'}
                    </span>
                    <span className="font-nepali font-mono-tabular font-semibold text-slate-900 dark:text-white">
                      {quickNepaliDigits || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      {lang === 'ne' ? 'अंग्रेजी अंक:' : 'English:'}
                    </span>
                    <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                      {quickEnglishDigits || '—'}
                    </span>
                  </div>
                  {numberWords.ne && (
                    <div className="pt-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {lang === 'ne' ? 'शब्दमा:' : 'In Words:'} ·{' '}
                          <span className="font-mono-tabular">
                            {numberWords.formatted}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyWords}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          {copiedWords ? (
                            <Check
                              className="h-3 w-3 text-emerald-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <Copy className="h-3 w-3" aria-hidden="true" />
                          )}
                          <span>
                            {copiedWords
                              ? lang === 'ne'
                                ? 'कपी भयो!'
                                : 'Copied!'
                              : lang === 'ne'
                                ? 'कपी'
                                : 'Copy'}
                          </span>
                        </button>
                      </div>
                      <p className="font-nepali mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                        {numberWords.ne}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {numberWords.en}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Sidebar Panel: Recent Conversions (Last 5 via localStorage) */}
              <RecentConversionsPanel
                items={history}
                lang={lang}
                onRestore={handleRestoreHistoryItem}
                onRemove={handleRemoveHistoryItem}
                onClearAll={handleClearHistory}
              />
            </div>
          </div>
        </main>

        {/* Clean Public Footer */}
        <footer className="mt-10 border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-[#0A101D]">
          <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                unicode.pabansubedi.com.np
              </span>{' '}
              ·{' '}
              {lang === 'ne'
                ? 'नेपाली युनिकोड, फन्ट कन्भर्टर तथा विक्रम सम्वत् मिति उपकरण'
                : 'Nepali Unicode, Font Converter & Bikram Sambat Date Suite'}
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="font-medium hover:text-red-700 hover:underline dark:hover:text-red-400"
            >
              {lang === 'ne' ? 'गोपनीयता नीति र सर्तहरू' : 'Privacy Policy & Terms'}
            </button>
          </div>
        </footer>
      </div>

      {/* Print Preview & Fallback Export Modal (ensures Print works in all browsers & iframes) */}
      {showPrintModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-preview-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs print:hidden"
        >
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0D131F]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                <h2
                  id="print-preview-title"
                  className="text-sm font-bold text-slate-900 dark:text-white"
                >
                  {lang === 'ne' ? 'प्रिन्ट पूर्वावलोकन (Print Preview)' : 'Print Preview'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                aria-label="Close print preview"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-100/80 p-4 sm:p-6 dark:bg-[#070B14]">
              <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xs">
                <div className="font-nepali whitespace-pre-wrap text-[15px] leading-[1.85]">
                  {printText}
                </div>
                <div className="mt-6 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
                  {todayClock.bs.formattedNe} · {todayClock.bs.formattedEn} · unicode.pabansubedi.com.np
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-[#0A101D]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'ne'
                  ? 'प्रिन्ट डाइलग नखुलेमा HTML पेज डाउनलोड गरी प्रिन्ट गर्नुहोस्।'
                  : 'If your browser preview blocks native Print, download the Print HTML sheet.'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPrintableHtml}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{lang === 'ne' ? 'प्रिन्ट HTML (.html)' : 'Print HTML (.html)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.print();
                    } catch {
                      // ignore if sandboxed
                    }
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-red-700 hover:to-rose-700"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{lang === 'ne' ? 'प्रिन्ट / Save PDF' : 'Print / Save PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean Print-Only Document Output */}
      <article
        id="printable-document"
        aria-hidden="true"
        className="hidden bg-white text-slate-900 print:block"
      >
        <div className="font-nepali whitespace-pre-wrap text-[13pt] leading-[1.85] text-slate-900">
          {printText}
        </div>
        <div className="mt-8 border-t border-slate-200 pt-3 text-[9pt] text-slate-500">
          <span>{todayClock.bs.formattedNe}</span> · <span>{todayClock.bs.formattedEn}</span> ·{' '}
          <span>unicode.pabansubedi.com.np</span>
        </div>
      </article>
    </>
  );
}
