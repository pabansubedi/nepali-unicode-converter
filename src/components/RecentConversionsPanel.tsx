import {useState} from 'react';
import {Check, Copy, Download, History, RotateCcw, Trash2, X} from 'lucide-react';
import type {HistoryItem} from '../utils/conversionHistory';

interface RecentConversionsPanelProps {
  items: HistoryItem[];
  lang: 'en' | 'ne';
  onRestore: (item: HistoryItem) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export function RecentConversionsPanel({
  items,
  lang,
  onRestore,
  onRemove,
  onClearAll,
}: RecentConversionsPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exported, setExported] = useState<boolean>(false);

  const handleCopyItem = async (item: HistoryItem) => {
    if (!item.output) return;
    try {
      await navigator.clipboard.writeText(item.output);
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((curr) => (curr === item.id ? null : curr));
      }, 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleExportJson = () => {
    if (items.length === 0) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      source: 'unicode.pabansubedi.com.np',
      count: items.length,
      items,
    };
    const jsonText = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonText], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nepali-conversion-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 1800);
  };

  return (
    <section
      id="recent-conversions"
      aria-label={lang === 'ne' ? 'हालसालैका रूपान्तरण इतिहास' : 'Recent Conversions History'}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0D131F]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History
            className="h-4 w-4 text-red-700 dark:text-red-400"
            aria-hidden="true"
          />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {lang === 'ne' ? 'हालसालैका ५ रूपान्तरण' : 'Recent Conversions'}
          </h2>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExportJson}
              title={
                lang === 'ne'
                  ? 'सम्पूर्ण इतिहास JSON फाइलमा ब्याकअप गर्नुहोस्'
                  : 'Export entire history list as JSON backup'
              }
              aria-label={
                lang === 'ne'
                  ? 'इतिहास JSON फाइल निर्यात गर्नुहोस्'
                  : 'Export conversion history as JSON'
              }
              className="inline-flex min-h-[28px] items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
            >
              {exported ? (
                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <Download className="h-3 w-3" aria-hidden="true" />
              )}
              <span>
                {exported
                  ? lang === 'ne'
                    ? 'सेभ भयो'
                    : 'Saved!'
                  : lang === 'ne'
                    ? 'JSON'
                    : 'Export JSON'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex min-h-[28px] items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              <span>{lang === 'ne' ? 'हटाउनुहोस्' : 'Clear'}</span>
            </button>
          </div>
        )}
      </div>

      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
        {lang === 'ne'
          ? 'पछिल्ला ५ सफल रूपान्तरण तपाईंको ब्राउजरमा सुरक्षित रहन्छन्।'
          : 'Last 5 conversions saved locally in your browser.'}
      </p>

      {items.length === 0 ? (
        <div className="mt-3 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {lang === 'ne'
            ? 'कुनै पाठ रूपान्तरण, कपी वा डाउनलोड गरेपछि यहाँ छिटो पुनः प्रयोगको लागि देखिनेछ।'
            : 'Convert, copy, or download text to automatically save up to 5 recent snippets here.'}
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {items.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <li key={item.id} className="py-2.5 first:pt-2.5 last:pb-0.5">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onRestore(item)}
                    title={
                      lang === 'ne'
                        ? 'यो पाठ कन्भर्टरमा लोड गर्नुहोस्'
                        : 'Restore this conversion into editor'
                    }
                    className="group min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 group-hover:text-red-700 dark:text-slate-300 dark:group-hover:text-red-400">
                        {item.sourceLabel} → {item.targetLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{item.createdAt}</span>
                    </div>
                    <p className="font-nepali mt-1 line-clamp-2 text-xs leading-relaxed font-medium text-slate-900 group-hover:text-red-700 dark:text-slate-100 dark:group-hover:text-red-400">
                      {item.previewText || item.output}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onRestore(item)}
                      aria-label={
                        lang === 'ne'
                          ? 'कन्भर्टरमा पुनः लोड गर्नुहोस्'
                          : 'Restore text'
                      }
                      title={lang === 'ne' ? 'पुनः लोड' : 'Restore'}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyItem(item)}
                      aria-label={lang === 'ne' ? 'कपी गर्नुहोस्' : 'Copy output'}
                      title={lang === 'ne' ? 'कपी' : 'Copy'}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      {isCopied ? (
                        <Check
                          className="h-3.5 w-3.5 text-emerald-600"
                          aria-hidden="true"
                        />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      aria-label={
                        lang === 'ne' ? 'इतिहासबाट हटाउनुहोस्' : 'Remove item'
                      }
                      title={lang === 'ne' ? 'हटाउनुहोस्' : 'Remove'}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
