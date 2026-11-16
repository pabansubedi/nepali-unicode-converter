import {useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowLeftRight,
  Code2,
  Copy,
  Moon,
  Search,
  Sparkles,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import type {WorkspaceMode} from '../utils/conversionHistory';
import {NEPALI_TEMPLATES} from '../utils/nepaliTemplates';
import {PREETI_ALT_CODES} from '../utils/preetiEngine';

export type PaletteActionKind =
  | 'copy'
  | 'swap'
  | 'clear'
  | 'find'
  | 'inspector'
  | 'alt-list'
  | 'theme'
  | 'lang'
  | 'to-ne-digits'
  | 'to-en-digits'
  | 'clean'
  | 'sort'
  | 'dedupe';

interface PaletteItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  shortcut?: string;
  badge?: string;
  keywords: string;
  onSelect: () => void;
}

interface CommandPaletteModalProps {
  open: boolean;
  onClose: () => void;
  lang: 'en' | 'ne';
  onSwitchMode: (mode: WorkspaceMode) => void;
  onRunAction: (kind: PaletteActionKind) => void;
  onInsertAltCode: (unicode: string, asciiChar: string) => void;
  onApplyTemplate: (templateId: string) => void;
}

export function CommandPaletteModal({
  open,
  onClose,
  lang,
  onSwitchMode,
  onRunAction,
  onInsertAltCode,
  onApplyTemplate,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const actions: PaletteItem[] = [
      {
        id: 'act-copy',
        category: lang === 'ne' ? 'एक्सन' : 'Actions',
        title: lang === 'ne' ? 'नतिजा कपी गर्नुहोस्' : 'Copy Converted Output',
        shortcut: 'Ctrl+Shift+C',
        keywords: 'copy clipboard output नतिजा कपी',
        onSelect: () => onRunAction('copy'),
      },
      {
        id: 'act-find',
        category: lang === 'ne' ? 'ह्याकर / पावर टुल' : 'Power Tools',
        title: lang === 'ne' ? 'Find & Replace (Regex) खोल्नुहोस्' : 'Toggle Find & Replace (Regex)',
        shortcut: 'Ctrl+Shift+F',
        keywords: 'find replace regex search खोज्नुहोस् रेजेक्स',
        onSelect: () => onRunAction('find'),
      },
      {
        id: 'act-inspector',
        category: lang === 'ne' ? 'ह्याकर / पावर टुल' : 'Power Tools',
        title: lang === 'ne' ? 'Unicode / UTF-8 Hex Inspector खोल्नुहोस्' : 'Toggle Unicode / UTF-8 Hex Inspector',
        shortcut: 'Ctrl+Shift+I',
        keywords: 'inspector unicode hex utf8 html escape dev codepoint',
        onSelect: () => onRunAction('inspector'),
      },
      {
        id: 'act-alt-list',
        category: lang === 'ne' ? 'ह्याकर / पावर टुल' : 'Power Tools',
        title: lang === 'ne' ? 'Alt+0xxx सर्टकट प्यानल टगल' : 'Toggle Alt+0xxx Shortcuts Grid',
        keywords: 'alt code shortcut सर्टकट प्यानल',
        onSelect: () => onRunAction('alt-list'),
      },
      {
        id: 'act-swap',
        category: lang === 'ne' ? 'एक्सन' : 'Actions',
        title: lang === 'ne' ? 'इनपुट र आउटपुट साटासाट' : 'Swap Source & Target',
        shortcut: 'Ctrl+Shift+S',
        keywords: 'swap reverse साटासाट उल्टो',
        onSelect: () => onRunAction('swap'),
      },
      {
        id: 'act-sort',
        category: lang === 'ne' ? 'टेक्स्ट टुल' : 'Text Tools',
        title: lang === 'ne' ? 'लाइनहरू क्रमबद्ध (अ–ज्ञ)' : 'Sort Lines Alphabetically (अ–ज्ञ)',
        keywords: 'sort lines order क्रमबद्ध',
        onSelect: () => onRunAction('sort'),
      },
      {
        id: 'act-dedupe',
        category: lang === 'ne' ? 'टेक्स्ट टुल' : 'Text Tools',
        title: lang === 'ne' ? 'दोहोरिएका लाइन हटाउनुहोस्' : 'Dedupe Duplicate Lines',
        keywords: 'dedupe unique duplicate दोहोरिएको',
        onSelect: () => onRunAction('dedupe'),
      },
      {
        id: 'act-clean',
        category: lang === 'ne' ? 'टेक्स्ट टुल' : 'Text Tools',
        title: lang === 'ne' ? 'अनावश्यक खाली ठाउँ सफा' : 'Clean Extra Spaces & Blank Lines',
        keywords: 'clean trim spaces whitespace सफा',
        onSelect: () => onRunAction('clean'),
      },
      {
        id: 'act-ne-digits',
        category: lang === 'ne' ? 'टेक्स्ट टुल' : 'Text Tools',
        title: '0-9 → ०-९ (Convert to Nepali Digits)',
        keywords: 'digits nepali numbers अंक ०-९',
        onSelect: () => onRunAction('to-ne-digits'),
      },
      {
        id: 'act-en-digits',
        category: lang === 'ne' ? 'टेक्स्ट टुल' : 'Text Tools',
        title: '०-९ → 0-9 (Convert to English Digits)',
        keywords: 'digits english numbers अंक 0-9',
        onSelect: () => onRunAction('to-en-digits'),
      },
      {
        id: 'act-theme',
        category: lang === 'ne' ? 'सेटिङ' : 'Preferences',
        title: lang === 'ne' ? 'डार्क / लाइट थिम बदल्नुहोस्' : 'Toggle Dark / Light Theme',
        keywords: 'theme dark light mode डार्क लाइट',
        onSelect: () => onRunAction('theme'),
      },
      {
        id: 'act-lang',
        category: lang === 'ne' ? 'सेटिङ' : 'Preferences',
        title: lang === 'ne' ? 'भाषा बदल्नुहोस् (नेपाली / English)' : 'Switch Language (Nepali / English)',
        keywords: 'language nepali english नेपाली भाषा',
        onSelect: () => onRunAction('lang'),
      },
      {
        id: 'act-clear',
        category: lang === 'ne' ? 'एक्सन' : 'Actions',
        title: lang === 'ne' ? 'सम्पन्न पाठ खाली गर्नुहोस्' : 'Clear Editor',
        keywords: 'clear reset empty खाली',
        onSelect: () => onRunAction('clear'),
      },
      {
        id: 'mode-p2u',
        category: lang === 'ne' ? 'मोड बदल्नुहोस्' : 'Switch Mode',
        title: 'Preeti → Unicode',
        keywords: 'mode preeti unicode प्रीति युनिकोड',
        onSelect: () => onSwitchMode('preeti-to-unicode'),
      },
      {
        id: 'mode-u2p',
        category: lang === 'ne' ? 'मोड बदल्नुहोस्' : 'Switch Mode',
        title: 'Unicode → Preeti',
        keywords: 'mode unicode preeti युनिकोड प्रीति',
        onSelect: () => onSwitchMode('unicode-to-preeti'),
      },
      {
        id: 'mode-multi',
        category: lang === 'ne' ? 'मोड बदल्नुहोस्' : 'Switch Mode',
        title: 'Multi-Font (Kantipur, Himali, PCS Nepali)',
        keywords: 'mode multi kantipur sagarmatha himali pcs ganesh ritu',
        onSelect: () => onSwitchMode('multi-font'),
      },
      {
        id: 'mode-rom',
        category: lang === 'ne' ? 'मोड बदल्नुहोस्' : 'Switch Mode',
        title: 'Romanized → Nepali Unicode',
        keywords: 'mode romanized phonetic रोमनाइज्ड',
        onSelect: () => onSwitchMode('romanized'),
      },
    ];

    const templates: PaletteItem[] = NEPALI_TEMPLATES.map((tpl) => ({
      id: `tpl-${tpl.id}`,
      category: lang === 'ne' ? 'निवेदन टेम्प्लेट' : 'Templates',
      title: lang === 'ne' ? tpl.labelNe : tpl.labelEn,
      keywords: `template ${tpl.labelEn} ${tpl.labelNe}`,
      onSelect: () => onApplyTemplate(tpl.id),
    }));

    const altCodes: PaletteItem[] = PREETI_ALT_CODES.map((alt) => ({
      id: `alt-${alt.code}`,
      category: lang === 'ne' ? 'Alt+Code अक्षर थप्नुहोस्' : 'Insert Alt+Code Character',
      title: `${alt.unicode}  —  ${lang === 'ne' ? alt.labelNe : alt.labelEn}`,
      badge: alt.unicode,
      shortcut: alt.altLabel,
      keywords: `alt ${alt.code} ${alt.altLabel} ${alt.unicode} ${alt.labelEn} ${alt.labelNe}`,
      onSelect: () => onInsertAltCode(alt.unicode, alt.asciiChar),
    }));

    return [...actions, ...templates, ...altCodes];
  }, [lang, onApplyTemplate, onInsertAltCode, onRunAction, onSwitchMode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 26);
    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q) ||
          (item.shortcut?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 32);
  }, [items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const activeEl = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({block: 'nearest'});
  }, [activeIndex]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) =>
        filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0,
      );
      return;
    }
    if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      filtered[activeIndex].onSelect();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'ne' ? 'कमान्ड प्यालेट' : 'Command Palette'}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 px-4 pt-16 sm:pt-24 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700/90 dark:bg-slate-900"
      >
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Terminal className="h-4 w-4 shrink-0 text-red-700 dark:text-red-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'ne'
                ? 'कमान्ड, Alt+0170, regex, वा टेम्प्लेट खोज्नुहोस्...'
                : 'Type a command, Alt code (e.g. 0170), mode, or symbol...'
            }
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <ul
          ref={listRef}
          className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto py-1 dark:divide-slate-800/70"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ne'
                ? 'कुनै मिल्दो कमान्ड वा Alt कोड भेटिएन।'
                : 'No matching commands or Alt codes found.'}
            </li>
          ) : (
            filtered.map((item, idx) => {
              const selected = idx === activeIndex;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      item.onSelect();
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                      selected
                        ? 'bg-red-50/90 text-red-900 dark:bg-red-950/40 dark:text-red-200'
                        : 'text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {item.badge ? (
                        <span className="font-nepali inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-bold text-red-700 dark:bg-slate-800 dark:text-red-400">
                          {item.badge}
                        </span>
                      ) : item.id.startsWith('act-find') ? (
                        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      ) : item.id.startsWith('act-inspector') ? (
                        <Code2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      ) : item.id.startsWith('act-copy') ? (
                        <Copy className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      ) : item.id.startsWith('act-swap') ? (
                        <ArrowLeftRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      ) : item.id.startsWith('act-theme') ? (
                        <Moon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      ) : item.id.startsWith('act-clear') ? (
                        <Trash2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      ) : (
                        <Sparkles className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <div className="font-nepali truncate text-xs font-semibold sm:text-sm">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.category}
                        </div>
                      </div>
                    </div>

                    {item.shortcut && (
                      <kbd className="font-mono-tabular shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
          <span>↑↓ {lang === 'ne' ? 'छान्नुहोस्' : 'Navigate'} · ↵ {lang === 'ne' ? 'चलाउनुहोस्' : 'Run'}</span>
          <span>Esc {lang === 'ne' ? 'बन्द' : 'Close'}</span>
        </div>
      </div>
    </div>
  );
}
