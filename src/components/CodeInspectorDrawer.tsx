import {useMemo, useState} from 'react';
import {Check, Code2, Copy} from 'lucide-react';

interface CodeInspectorDrawerProps {
  text: string;
  lang: 'en' | 'ne';
}

interface CodepointEntry {
  char: string;
  codePointHex: string;
  utf8Hex: string;
  htmlEntity: string;
  jsEscape: string;
}

function toUtf8Hex(ch: string): string {
  const bytes = new TextEncoder().encode(ch);
  return Array.from(bytes)
    .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

function encodeUnicodeEscape(input: string): string {
  let out = '';
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp > 127) {
      out +=
        cp <= 0xffff
          ? `\\u${cp.toString(16).toUpperCase().padStart(4, '0')}`
          : `\\u{${cp.toString(16).toUpperCase()}}`;
    } else {
      out += ch;
    }
  }
  return out;
}

function encodeHtmlEntities(input: string): string {
  let out = '';
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    out += cp > 127 ? `&#${cp};` : ch;
  }
  return out;
}

export function CodeInspectorDrawer({text, lang}: CodeInspectorDrawerProps) {
  const [copiedKind, setCopiedKind] = useState<string | null>(null);

  const codepoints = useMemo<CodepointEntry[]>(() => {
    const out: CodepointEntry[] = [];
    for (const ch of text) {
      if (ch === '\n' || ch === '\r') continue;
      const cp = ch.codePointAt(0);
      if (cp === undefined) continue;
      out.push({
        char: ch,
        codePointHex: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
        utf8Hex: toUtf8Hex(ch),
        htmlEntity: `&#${cp};`,
        jsEscape: `\\u${cp.toString(16).toUpperCase().padStart(4, '0')}`,
      });
      if (out.length >= 42) break;
    }
    return out;
  }, [text]);

  const handleCopyPayload = async (kind: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKind(kind);
      window.setTimeout(() => {
        setCopiedKind((curr) => (curr === kind ? null : curr));
      }, 1600);
    } catch {
      // ignore clipboard errors
    }
  };

  const unicodeEscaped = useMemo(() => encodeUnicodeEscape(text), [text]);
  const htmlEncoded = useMemo(() => encodeHtmlEntities(text), [text]);
  const urlEncoded = useMemo(() => {
    try {
      return encodeURIComponent(text);
    } catch {
      return '';
    }
  }, [text]);
  const fullHex = useMemo(() => toUtf8Hex(text.slice(0, 120)), [text]);

  return (
    <div className="mt-3 rounded-xl border border-slate-200/90 bg-slate-950 p-3.5 text-slate-100 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Code2 className="h-4 w-4" aria-hidden="true" />
          <span className="font-mono-tabular">
            {lang === 'ne'
              ? 'UNICODE & UTF-8 BYTE INSPECTOR'
              : 'UNICODE & UTF-8 BYTE INSPECTOR'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            {id: 'u-escape', label: '\\uXXXX', value: unicodeEscaped},
            {id: 'html', label: '&#HTML;', value: htmlEncoded},
            {id: 'url', label: '%URL', value: urlEncoded},
            {id: 'hex', label: 'UTF-8 Hex', value: fullHex},
          ].map((fmt) => {
            const isCopied = copiedKind === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                disabled={!text}
                onClick={() => handleCopyPayload(fmt.id, fmt.value)}
                className="font-mono-tabular inline-flex min-h-[28px] items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-200 transition-colors hover:border-emerald-500/60 hover:text-emerald-300 disabled:opacity-40"
              >
                {isCopied ? (
                  <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="h-3 w-3 text-slate-400" aria-hidden="true" />
                )}
                <span>{isCopied ? (lang === 'ne' ? 'कपी!' : 'Copied!') : fmt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {codepoints.length === 0 ? (
        <p className="font-mono-tabular py-3 text-xs text-slate-400">
          {lang === 'ne'
            ? '// बाकस खाली छ — कोडपोइन्ट हेर्न पाठ टाइप गर्नुहोस्'
            : '// Empty buffer — type or paste text to inspect UTF-8 codepoints'}
        </p>
      ) : (
        <>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8">
            {codepoints.map((entry, idx) => {
              const cellKey = `cp-${idx}`;
              const isCopied = copiedKind === cellKey;
              return (
                <button
                  key={`${entry.codePointHex}-${idx}`}
                  type="button"
                  onClick={() => handleCopyPayload(cellKey, entry.jsEscape)}
                  title={`${entry.char} | ${entry.codePointHex} | ${entry.htmlEntity}`}
                  className="flex flex-col items-start rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1.5 text-left transition-colors hover:border-emerald-500/60 hover:bg-slate-900"
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <span className="font-nepali text-sm font-bold text-white">
                      {entry.char === ' ' ? '␣' : entry.char}
                    </span>
                    <span className="font-mono-tabular text-[10px] text-emerald-400">
                      {isCopied ? '✓' : entry.codePointHex}
                    </span>
                  </div>
                  <span className="font-mono-tabular mt-0.5 truncate text-[10px] text-slate-400">
                    {entry.utf8Hex}
                  </span>
                </button>
              );
            })}
          </div>
          {text.length > 42 && (
            <div className="font-mono-tabular mt-2 text-[11px] text-slate-500">
              {lang === 'ne'
                ? `// पहिलो ४२ कोडपोइन्ट देखाइएको छ (कुल ${text.length} अक्षर)`
                : `// Showing first 42 codepoints of ${text.length} chars · Click any cell to copy \\uXXXX`}
            </div>
          )}
        </>
      )}
    </div>
  );
}
