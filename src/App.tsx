import {useEffect, useMemo, useState} from 'react';
import {Check, Copy, Menu, Moon, Share2, Sun, X} from 'lucide-react';
import {AdSenseSlot} from './components/AdSenseSlot';
import {
  ConverterWorkspace,
  type WorkspaceMode,
} from './components/ConverterWorkspace';
import {DateTimePanel} from './components/DateTimePanel';
import {GuideAndFaq} from './components/GuideAndFaq';
import {RecentConversionsPanel} from './components/RecentConversionsPanel';
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
      return localStorage.getItem('nus_theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [clock, setClock] = useState<NepalClockState>(() => getNepalNow());
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [quickNumInput, setQuickNumInput] = useState<string>('125000');
  const [copiedWords, setCopiedWords] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>(
    'idle',
  );
  const [printText, setPrintText] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    loadConversionHistory(),
  );
  const [restoreRequest, setRestoreRequest] = useState<{
    item: HistoryItem;
    nonce: number;
  } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('nus_theme', dark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [dark]);

  useEffect(() => {
    try {
      localStorage.setItem('nus_lang', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClock(getNepalNow());
    }, 1000);
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
    setPrintText(text);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.print();
      });
    });
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
      <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors print:hidden dark:bg-slate-950 dark:text-slate-100">
        {/* Top Bar Contract: 3 zones separated by gap-8 */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-4 py-3 sm:px-6">
            {/* Zone 1: Single-line Brand Wordmark */}
            <a
              href="#top"
              className="whitespace-nowrap shrink-0 text-lg font-bold tracking-tight text-slate-900 dark:text-white"
            >
              Nepali Unicode
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

            {/* Zone 3: 1 Primary Action (Web Share API Button + Mobile Menu Trigger) */}
            <div className="flex items-center gap-2 shrink-0">
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
              </div>
            </nav>
          )}
        </header>

        <main id="top" className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
          {/* Hero Headline + Live Nepali Date/Time + Quick Theme/Language Strip */}
          <section className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end dark:border-slate-800">
            <div className="max-w-2xl">
              <h1 className="font-nepali text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {lang === 'ne'
                  ? 'प्रीति र नेपाली युनिकोड कन्भर्टर'
                  : 'Preeti to Unicode & Nepali Font Converter'}
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {lang === 'ne'
                  ? 'Preeti, Kantipur, Sagarmatha, Himali, PCS Nepali र Romanized बाट तुरुन्त युनिकोड रूपान्तरण, नेपाली मिति र समय।'
                  : 'Convert Preeti, Kantipur, Sagarmatha, Himali, PCS Nepali, and Romanized typing to Unicode Devanagari instantly.'}
              </p>
              <div className="font-nepali mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-red-700 dark:text-red-400">
                  {clock.bs.formattedNe}
                </span>
                <span aria-hidden="true">·</span>
                <span>{clock.bs.formattedEn}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular font-semibold text-slate-800 dark:text-slate-100">
                  NPT {clock.time12En}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div
                role="group"
                aria-label="Language toggle"
                className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800"
              >
                <button
                  type="button"
                  onClick={() => setLang('ne')}
                  className={`min-h-[36px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    lang === 'ne'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                  }`}
                >
                  नेपाली
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`min-h-[36px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    lang === 'en'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                  }`}
                >
                  English
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDark((d) => !d)}
                aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {dark ? (
                  <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-600" aria-hidden="true" />
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
          </section>

          {/* Responsive 2-Column Layout: Primary Content + Sidebar */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Primary Workspace Column */}
            <div className="min-w-0 flex-1 space-y-6">
              <ConverterWorkspace
                mode={mode}
                onModeChange={setMode}
                lang={lang}
                bsDateText={clock.bs.formattedNe}
                history={history}
                onSaveHistory={handleSaveHistory}
                onRemoveHistoryItem={handleRemoveHistoryItem}
                onClearHistory={handleClearHistory}
                restoreRequest={restoreRequest}
                onPrintOutput={handlePrintOutput}
              />

              {/* In-Content Responsive AdSense Slot */}
              <AdSenseSlot variant="in-content" lang={lang} />

              <DateTimePanel clock={clock} lang={lang} />

              <GuideAndFaq
                lang={lang}
                showPrivacyModal={showPrivacyModal}
                onClosePrivacyModal={() => setShowPrivacyModal(false)}
              />
            </div>

            {/* Dedicated Right Sidebar */}
            <div className="w-full shrink-0 space-y-5 lg:w-[320px] xl:w-[336px]">
              {/* Top Sidebar Ad Unit (300x250) */}
              <AdSenseSlot variant="sidebar-top" lang={lang} />

              {/* Sidebar Utility: Digit Converter & Number to Nepali/English Words */}
              <section
                id="number-words"
                aria-label="Nepali Digit and Number to Words Converter"
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
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
                  className="font-mono-tabular mt-2.5 h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
                    <span className="text-slate-500 dark:text-slate-400">
                      {lang === 'ne' ? 'नेपाली अंक:' : 'Nepali:'}
                    </span>
                    <span className="font-nepali font-mono-tabular font-semibold text-slate-900 dark:text-white">
                      {quickNepaliDigits || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
                    <span className="text-slate-500 dark:text-slate-400">
                      {lang === 'ne' ? 'अंग्रेजी अंक:' : 'English:'}
                    </span>
                    <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                      {quickEnglishDigits || '—'}
                    </span>
                  </div>
                  {numberWords.ne && (
                    <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {lang === 'ne' ? 'शब्दमा (रकम):' : 'In Words:'} ·{' '}
                          <span className="font-mono-tabular">
                            {numberWords.formatted}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyWords}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          {copiedWords ? (
                            <Check
                              className="h-3 w-3 text-emerald-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <Copy className="h-3 w-3" aria-hidden="true" />
                          )}
                          <span>{copiedWords ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="font-nepali mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                        {numberWords.ne}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
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

              {/* Sticky Sidebar Ad Unit (300x600 / Auto) */}
              <div className="lg:sticky lg:top-20">
                <AdSenseSlot variant="sidebar-sticky" lang={lang} />
              </div>
            </div>
          </div>
        </main>

        {/* Clean Public Footer */}
        <footer className="mt-10 border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
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

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="font-medium hover:text-red-700 hover:underline dark:hover:text-red-400"
              >
                {lang === 'ne' ? 'गोपनीयता नीति र सर्तहरू' : 'Privacy Policy & Terms'}
              </button>
            </div>
          </div>
        </footer>
      </div>

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
          <span>{clock.bs.formattedNe}</span> · <span>{clock.bs.formattedEn}</span> ·{' '}
          <span>unicode.pabansubedi.com.np</span>
        </div>
      </article>
    </>
  );
}
