import {useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowLeftRight,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  FileText,
  History,
  Maximize2,
  Minimize2,
  Printer,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import {
  type HistoryItem,
  type WorkspaceMode,
} from '../utils/conversionHistory';
import {NEPALI_TEMPLATES} from '../utils/nepaliTemplates';
import {
  cleanNepaliText,
  computeTextMetrics,
  convertBetweenFonts,
  dedupeNepaliLines,
  NEPALI_FONTS,
  type NepaliFontId,
  PREETI_ALT_CODES,
  preetiToUnicode,
  resolvePreetiAltCode,
  sortNepaliLines,
  toEnglishDigits,
  toNepaliDigits,
} from '../utils/preetiEngine';
import {
  ROMANIZED_EXAMPLES,
  romanizedToUnicode,
} from '../utils/romanizedEngine';

export type {WorkspaceMode};

interface ConverterWorkspaceProps {
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  lang: 'en' | 'ne';
  bsDateText: string;
  history: HistoryItem[];
  onSaveHistory: (item: HistoryItem) => void;
  onRemoveHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  restoreRequest?: {item: HistoryItem; nonce: number} | null;
  onPrintOutput?: (text: string) => void;
}

const QUICK_SYMBOLS = [
  '।',
  '॥',
  'ॐ',
  'रु.',
  'क्ष',
  'त्र',
  'ज्ञ',
  'श्र',
  'द्य',
  'द्ध',
  'ट्ट',
  'ह्म',
  '०',
  '१',
  '२',
  '३',
  '४',
  '५',
  '६',
  '७',
  '८',
  '९',
];

const SAMPLE_PREETI =
  'g]kfn Ps ;\'Gb/ lxdfnL b]z xf] . k|ljlwf / 1fgsf] ljsf;n] xfd|f] ;dfhnfO{ cufl8 a9fpF5 .';
const SAMPLE_UNICODE =
  'नेपाल एक सुन्दर हिमाली देश हो । प्रविधि र ज्ञानको विकासले हाम्रो समाजलाई अगाडि बढाउँछ ।';
const SAMPLE_ROMANIZED =
  'namaste! mero desh nepal ho. aaja ko prabidhi ra gyan le hamro samaj lai aagadi badhaauchha.';

export function ConverterWorkspace({
  mode,
  onModeChange,
  lang,
  bsDateText,
  history,
  onSaveHistory,
  onRemoveHistoryItem,
  onClearHistory,
  restoreRequest,
  onPrintOutput,
}: ConverterWorkspaceProps) {
  const [fromFont, setFromFont] = useState<NepaliFontId>('preeti');
  const [toFont, setToFont] = useState<NepaliFontId>('unicode');
  const [preetiVisualTyping, setPreetiVisualTyping] = useState<boolean>(true);
  const [outputVisualNepali, setOutputVisualNepali] = useState<boolean>(true);
  const [unicodeInputHelper, setUnicodeInputHelper] = useState<
    'direct' | 'preeti' | 'romanized'
  >('preeti');
  const [inputText, setInputText] = useState<string>(SAMPLE_UNICODE);
  const [manualOutput, setManualOutput] = useState<string>('');
  const [autoConvert, setAutoConvert] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(17);
  const [copied, setCopied] = useState<boolean>(false);
  const [pasted, setPasted] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showAltPalette, setShowAltPalette] = useState<boolean>(false);
  const [altDigitsPreview, setAltDigitsPreview] = useState<string>('');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [undoSnapshot, setUndoSnapshot] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Word-level buffer for live Preeti keystroke -> Nepali Devanagari rendering
  const preetiBufferRef = useRef<string>('');
  const wordStartRef = useRef<number>(0);
  const wordEndRef = useRef<number>(0);
  const altDigitsRef = useRef<string>('');
  const skipNextModeResetRef = useRef<boolean>(false);

  const resetPreetiBuffer = () => {
    preetiBufferRef.current = '';
    wordStartRef.current = 0;
    wordEndRef.current = 0;
  };

  useEffect(() => {
    if (skipNextModeResetRef.current) {
      skipNextModeResetRef.current = false;
      return;
    }
    resetPreetiBuffer();
    const isDefaultSample =
      inputText === SAMPLE_PREETI ||
      inputText === SAMPLE_UNICODE ||
      inputText === SAMPLE_ROMANIZED ||
      inputText === '';

    if (mode === 'preeti-to-unicode') {
      setFromFont('preeti');
      setToFont('unicode');
      if (isDefaultSample) {
        setInputText(preetiVisualTyping ? SAMPLE_UNICODE : SAMPLE_PREETI);
      }
    } else if (mode === 'unicode-to-preeti') {
      setFromFont('unicode');
      setToFont('preeti');
      if (isDefaultSample) {
        setInputText(SAMPLE_UNICODE);
      }
    } else if (mode === 'romanized') {
      if (isDefaultSample) {
        setInputText(SAMPLE_ROMANIZED);
      }
    } else if (mode === 'multi-font') {
      if (isDefaultSample) {
        const nextSample =
          fromFont === 'unicode' || preetiVisualTyping
            ? SAMPLE_UNICODE
            : SAMPLE_PREETI;
        setInputText(nextSample);
      }
    }
  }, [mode]);

  const isLegacySourceMode =
    mode === 'preeti-to-unicode' ||
    (mode === 'multi-font' && fromFont !== 'unicode');

  const isUnicodeSourceMode =
    mode === 'unicode-to-preeti' ||
    (mode === 'multi-font' && fromFont === 'unicode');

  // Active live Preeti-to-Nepali typing applies in legacy source modes (when Nepali View is ON)
  // AND in Unicode source modes when user picks 'preeti' keyboard helper
  const isVisualPreetiActive =
    (isLegacySourceMode && preetiVisualTyping) ||
    (isUnicodeSourceMode && unicodeInputHelper === 'preeti');

  const isUnicodeRomanizedHelperActive =
    isUnicodeSourceMode && unicodeInputHelper === 'romanized';

  const sourceUnicodeText = useMemo(() => {
    if (!inputText) return '';
    if (mode === 'romanized' || isUnicodeRomanizedHelperActive) {
      return /[\u0900-\u097F]/.test(inputText)
        ? inputText
        : romanizedToUnicode(inputText);
    }
    if (isVisualPreetiActive) {
      return /[\u0900-\u097F]/.test(inputText)
        ? inputText
        : preetiToUnicode(inputText, fromFont === 'unicode' ? 'preeti' : fromFont);
    }
    if (isUnicodeSourceMode) {
      return inputText;
    }
    const activeSource =
      mode === 'preeti-to-unicode' ? 'preeti' : fromFont;
    return preetiToUnicode(inputText, activeSource);
  }, [
    inputText,
    mode,
    fromFont,
    isVisualPreetiActive,
    isUnicodeSourceMode,
    isUnicodeRomanizedHelperActive,
  ]);

  const computedOutput = useMemo(() => {
    if (!sourceUnicodeText) return '';
    if (mode === 'romanized' || mode === 'preeti-to-unicode') {
      return sourceUnicodeText;
    }
    if (mode === 'unicode-to-preeti') {
      return convertBetweenFonts(sourceUnicodeText, 'unicode', 'preeti');
    }
    return toFont === 'unicode'
      ? sourceUnicodeText
      : convertBetweenFonts(sourceUnicodeText, 'unicode', toFont);
  }, [sourceUnicodeText, mode, toFont]);

  const activeOutput = autoConvert ? computedOutput : manualOutput;

  // When output is a legacy ASCII font (e.g. Unicode -> Preeti), also prepare Nepali Devanagari rendering
  const isLegacyOutput =
    mode === 'unicode-to-preeti' ||
    (mode === 'multi-font' && toFont !== 'unicode');

  const outputNepaliPreview = useMemo(() => {
    if (!isLegacyOutput || !activeOutput) return '';
    if (autoConvert && sourceUnicodeText) {
      return sourceUnicodeText;
    }
    const target = mode === 'unicode-to-preeti' ? 'preeti' : toFont;
    return preetiToUnicode(activeOutput, target);
  }, [isLegacyOutput, activeOutput, autoConvert, sourceUnicodeText, mode, toFont]);

  // What is visually displayed inside the Output textarea:
  // If output is a legacy font and Nepali View is ON, display Nepali script visually while Copy/Download uses activeOutput (font code)
  const displayedOutput =
    isLegacyOutput && outputVisualNepali && outputNepaliPreview
      ? outputNepaliPreview
      : activeOutput;

  const inputMetrics = useMemo(() => computeTextMetrics(inputText), [inputText]);
  const outputMetrics = useMemo(
    () => computeTextMetrics(activeOutput),
    [activeOutput],
  );
  const utf8Bytes = useMemo(
    () => new TextEncoder().encode(activeOutput).length,
    [activeOutput],
  );

  const saveSnippetToHistory = (outText: string) => {
    if (!inputText.trim() || !outText.trim()) return;
    const effectiveFrom: NepaliFontId =
      mode === 'preeti-to-unicode'
        ? 'preeti'
        : mode === 'unicode-to-preeti'
          ? 'unicode'
          : fromFont;
    const effectiveTo: NepaliFontId =
      mode === 'preeti-to-unicode'
        ? 'unicode'
        : mode === 'unicode-to-preeti'
          ? 'preeti'
          : toFont;

    const sourceName =
      mode === 'romanized'
        ? 'Romanized'
        : NEPALI_FONTS.find((f) => f.id === effectiveFrom)?.name ?? effectiveFrom;
    const targetName =
      mode === 'romanized'
        ? 'Unicode'
        : NEPALI_FONTS.find((f) => f.id === effectiveTo)?.name ?? effectiveTo;

    const preview = isLegacyOutput
      ? outputNepaliPreview || outText
      : outText;

    const nextItem: HistoryItem = {
      id: `${Date.now()}`,
      mode,
      fromFont: effectiveFrom,
      toFont: effectiveTo,
      sourceLabel: sourceName,
      targetLabel: targetName,
      input: inputText.slice(0, 1500),
      output: outText.slice(0, 1500),
      previewText: preview.slice(0, 1500),
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    onSaveHistory(nextItem);
  };

  // Automatically record custom non-sample successful conversions after brief pause
  useEffect(() => {
    const trimmed = inputText.trim();
    if (
      !autoConvert ||
      trimmed.length < 4 ||
      !activeOutput.trim() ||
      inputText === SAMPLE_PREETI ||
      inputText === SAMPLE_UNICODE ||
      inputText === SAMPLE_ROMANIZED
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      saveSnippetToHistory(activeOutput);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [inputText, activeOutput, autoConvert, mode, fromFont, toFont]);

  // Restore history item when triggered from Sidebar panel
  useEffect(() => {
    if (!restoreRequest) return;
    const {item} = restoreRequest;
    resetPreetiBuffer();
    setUndoSnapshot(inputText);
    if (item.mode !== mode) {
      skipNextModeResetRef.current = true;
      onModeChange(item.mode);
    }
    setFromFont(item.fromFont || 'preeti');
    setToFont(item.toFont || 'unicode');
    setInputText(item.input);
    if (!autoConvert) {
      setManualOutput(item.output);
    }
  }, [restoreRequest]);

  const handleManualConvert = () => {
    setManualOutput(computedOutput);
    saveSnippetToHistory(computedOutput);
  };

  const handleSwap = () => {
    if (mode === 'romanized') return;
    resetPreetiBuffer();
    const nextInput = activeOutput;
    if (mode === 'preeti-to-unicode') {
      onModeChange('unicode-to-preeti');
    } else if (mode === 'unicode-to-preeti') {
      onModeChange('preeti-to-unicode');
    } else {
      const prevFrom = fromFont;
      setFromFont(toFont);
      setToFont(prevFrom);
    }
    setInputText(nextInput);
    if (!autoConvert) {
      setManualOutput(inputText);
    }
  };

  const applyPreetiKeyToText = (key: string, el: HTMLTextAreaElement) => {
    const selStart = el.selectionStart ?? inputText.length;
    const selEnd = el.selectionEnd ?? inputText.length;

    if (
      !preetiBufferRef.current ||
      selStart !== selEnd ||
      selStart !== wordEndRef.current
    ) {
      wordStartRef.current = selStart;
      wordEndRef.current = selEnd;
      preetiBufferRef.current = '';
    }

    preetiBufferRef.current += key;
    const activeLegacyFont = fromFont === 'unicode' ? 'preeti' : fromFont;
    const convertedWord = preetiToUnicode(
      preetiBufferRef.current,
      activeLegacyFont,
    );
    const before = inputText.slice(0, wordStartRef.current);
    const after = inputText.slice(wordEndRef.current);
    const nextValue = before + convertedWord + after;
    const nextCaret = wordStartRef.current + convertedWord.length;

    wordEndRef.current = nextCaret;
    setInputText(nextValue);

    window.requestAnimationFrame(() => {
      el.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const commitAltCodeInsert = (digits: string) => {
    const match = resolvePreetiAltCode(digits);
    if (!match) return;
    const textToInsert =
      isLegacySourceMode && !preetiVisualTyping ? match.asciiChar : match.unicode;
    handleInsertSymbol(textToInsert);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Capture Alt + 0xxx shortcut codes directly inside the editor (works even without Numpad)
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const nextDigits = (altDigitsRef.current + e.key).slice(0, 4);
        altDigitsRef.current = nextDigits;
        setAltDigitsPreview(nextDigits);
        if (nextDigits.length === 4 && resolvePreetiAltCode(nextDigits)) {
          commitAltCodeInsert(nextDigits);
          altDigitsRef.current = '';
          setAltDigitsPreview('');
        }
        return;
      }
    }

    if (!isVisualPreetiActive) return;
    const el = e.currentTarget;

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === ' ' || e.key === 'Enter' || e.key === 'Tab') {
      resetPreetiBuffer();
      return;
    }

    if (e.key === 'Backspace') {
      const selStart = el.selectionStart ?? 0;
      const selEnd = el.selectionEnd ?? 0;
      if (
        preetiBufferRef.current.length > 0 &&
        selStart === selEnd &&
        selStart === wordEndRef.current
      ) {
        e.preventDefault();
        preetiBufferRef.current = preetiBufferRef.current.slice(0, -1);
        const activeLegacyFont = fromFont === 'unicode' ? 'preeti' : fromFont;
        const convertedWord = preetiToUnicode(
          preetiBufferRef.current,
          activeLegacyFont,
        );
        const before = inputText.slice(0, wordStartRef.current);
        const after = inputText.slice(wordEndRef.current);
        const nextValue = before + convertedWord + after;
        const nextCaret = wordStartRef.current + convertedWord.length;
        wordEndRef.current = nextCaret;
        setInputText(nextValue);
        window.requestAnimationFrame(() => {
          el.setSelectionRange(nextCaret, nextCaret);
        });
      } else {
        resetPreetiBuffer();
      }
      return;
    }

    if (e.key.length === 1) {
      const code = e.key.charCodeAt(0);
      if (code >= 33 && code <= 126) {
        e.preventDefault();
        applyPreetiKeyToText(e.key, el);
      }
    }
  };

  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Alt' && altDigitsRef.current) {
      commitAltCodeInsert(altDigitsRef.current);
      altDigitsRef.current = '';
      setAltDigitsPreview('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;

    // Mobile virtual keyboard fallback: if a single ASCII char was inserted while in Preeti Visual mode
    if (isVisualPreetiActive && nextVal.length === inputText.length + 1) {
      const caret = e.target.selectionStart ?? nextVal.length;
      const inserted = nextVal[caret - 1];
      if (inserted) {
        const code = inserted.charCodeAt(0);
        if (code >= 33 && code <= 126) {
          // Restore virtual caret relative to previous inputText
          const el = e.target;
          const prevPos = caret - 1;
          if (
            !preetiBufferRef.current ||
            prevPos !== wordEndRef.current
          ) {
            wordStartRef.current = prevPos;
            wordEndRef.current = prevPos;
            preetiBufferRef.current = '';
          }
          preetiBufferRef.current += inserted;
          const activeLegacyFont = fromFont === 'unicode' ? 'preeti' : fromFont;
          const convertedWord = preetiToUnicode(
            preetiBufferRef.current,
            activeLegacyFont,
          );
          const before = inputText.slice(0, wordStartRef.current);
          const after = inputText.slice(wordEndRef.current);
          const fixedVal = before + convertedWord + after;
          const nextCaret = wordStartRef.current + convertedWord.length;
          wordEndRef.current = nextCaret;
          setInputText(fixedVal);
          window.requestAnimationFrame(() => {
            el.setSelectionRange(nextCaret, nextCaret);
          });
          return;
        }
      }
      resetPreetiBuffer();
    } else if (isVisualPreetiActive) {
      resetPreetiBuffer();
    }

    setInputText(nextVal);
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!isVisualPreetiActive) return;
    const raw = e.clipboardData.getData('text');
    if (!raw) return;

    // If pasted text is ASCII Preeti (contains no Devanagari), convert to Nepali Unicode visually
    if (!/[\u0900-\u097F]/.test(raw)) {
      e.preventDefault();
      resetPreetiBuffer();
      const el = e.currentTarget;
      const start = el.selectionStart ?? inputText.length;
      const end = el.selectionEnd ?? inputText.length;
      const converted = preetiToUnicode(raw, fromFont);
      const nextValue =
        inputText.slice(0, start) + converted + inputText.slice(end);
      setInputText(nextValue);
      const caret = start + converted.length;
      window.requestAnimationFrame(() => {
        el.setSelectionRange(caret, caret);
      });
    }
  };

  const handlePasteButton = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        resetPreetiBuffer();
        const finalValue =
          isVisualPreetiActive && !/[\u0900-\u097F]/.test(clipText)
            ? preetiToUnicode(clipText, fromFont)
            : clipText;
        setInputText(finalValue);
        setPasted(true);
        window.setTimeout(() => setPasted(false), 1600);
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleCopy = async () => {
    if (!activeOutput) return;
    try {
      await navigator.clipboard.writeText(activeOutput);
      setCopied(true);
      saveSnippetToHistory(activeOutput);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = activeOutput;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!activeOutput) return;
    const blob = new Blob([activeOutput], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nepali-converted-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    saveSnippetToHistory(activeOutput);
  };

  const handleDownloadDoc = () => {
    if (!activeOutput) return;
    const escaped = activeOutput
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    const docHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="ne">
<head>
<meta charset="utf-8" />
<title>Nepali Converted Document</title>
<style>
  body { font-family: "Noto Sans Devanagari", "Mangal", Arial, sans-serif; font-size: 12pt; line-height: 1.6; }
</style>
</head>
<body><p>${escaped}</p></body>
</html>`;

    const blob = new Blob(['\ufeff', docHtml], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nepali-document-${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    saveSnippetToHistory(activeOutput);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 2) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resetPreetiBuffer();
        const content = reader.result;
        if (isVisualPreetiActive && !/[\u0900-\u097F]/.test(content)) {
          setInputText(preetiToUnicode(content, fromFont));
        } else {
          setInputText(content);
        }
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleLoadSample = () => {
    resetPreetiBuffer();
    if (mode === 'unicode-to-preeti') {
      setInputText(SAMPLE_UNICODE);
    } else if (mode === 'romanized') {
      setInputText(SAMPLE_ROMANIZED);
    } else if (isVisualPreetiActive) {
      setInputText(SAMPLE_UNICODE);
    } else if (mode === 'multi-font' && fromFont === 'unicode') {
      setInputText(SAMPLE_UNICODE);
    } else {
      setInputText(SAMPLE_PREETI);
    }
  };

  const handleTogglePreetiVisual = () => {
    resetPreetiBuffer();
    const nextVisual = !preetiVisualTyping;
    setPreetiVisualTyping(nextVisual);
    if (inputText) {
      if (nextVisual && !/[\u0900-\u097F]/.test(inputText)) {
        setInputText(preetiToUnicode(inputText, fromFont));
      } else if (!nextVisual && /[\u0900-\u097F]/.test(inputText)) {
        setInputText(convertBetweenFonts(inputText, 'unicode', fromFont));
      }
    }
  };

  const handleInsertSymbol = (sym: string) => {
    resetPreetiBuffer();
    const el = inputRef.current;
    if (!el) {
      setInputText((prev) => prev + sym);
      return;
    }
    const start = el.selectionStart ?? inputText.length;
    const end = el.selectionEnd ?? inputText.length;
    const next = inputText.slice(0, start) + sym + inputText.slice(end);
    setInputText(next);
    window.requestAnimationFrame(() => {
      el.focus();
      const pos = start + sym.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const applyOutputTransform = (
    kind: 'to-ne-digits' | 'to-en-digits' | 'clean' | 'sort' | 'dedupe',
  ) => {
    resetPreetiBuffer();
    setUndoSnapshot(inputText);
    const transformFn = (txt: string) => {
      if (kind === 'to-ne-digits') return toNepaliDigits(txt);
      if (kind === 'to-en-digits') return toEnglishDigits(txt);
      if (kind === 'sort') return sortNepaliLines(txt);
      if (kind === 'dedupe') return dedupeNepaliLines(txt);
      return cleanNepaliText(txt);
    };
    if (kind === 'clean' || kind === 'sort' || kind === 'dedupe') {
      setInputText((prev) => transformFn(prev));
      return;
    }
    if (autoConvert) setInputText((prev) => transformFn(prev));
    else setManualOutput((prev) => transformFn(prev));
  };

  const handleApplyTemplate = (templateId: string) => {
    if (!templateId) return;
    const found = NEPALI_TEMPLATES.find((t) => t.id === templateId);
    if (!found) return;
    resetPreetiBuffer();
    setUndoSnapshot(inputText);
    if (mode === 'romanized' || mode === 'preeti-to-unicode') {
      skipNextModeResetRef.current = true;
      onModeChange('unicode-to-preeti');
      setFromFont('unicode');
      setToFont('preeti');
    } else if (mode === 'multi-font' && fromFont !== 'unicode') {
      setFromFont('unicode');
      if (toFont === 'unicode') setToFont('preeti');
    }
    setInputText(found.getBody(bsDateText));
  };

  const handleUndo = () => {
    if (undoSnapshot === null) return;
    resetPreetiBuffer();
    const prev = undoSnapshot;
    setUndoSnapshot(inputText);
    setInputText(prev);
  };

  const handlePrintClick = () => {
    if (!displayedOutput) return;
    saveSnippetToHistory(activeOutput);
    onPrintOutput?.(displayedOutput);
  };

  const modeTabs: Array<{id: WorkspaceMode; en: string; ne: string}> = [
    {id: 'preeti-to-unicode', en: 'Preeti → Unicode', ne: 'प्रीति → युनिकोड'},
    {id: 'unicode-to-preeti', en: 'Unicode → Preeti', ne: 'युनिकोड → प्रीति'},
    {id: 'multi-font', en: 'Multi-Font', ne: 'अन्य फन्टहरू'},
    {id: 'romanized', en: 'Romanized → Nepali', ne: 'रोमनाइज्ड → नेपाली'},
  ];

  const sourceLabel =
    mode === 'romanized'
      ? lang === 'ne'
        ? 'रोमन नेपाली टाइप गर्नुहोस्'
        : 'Romanized Nepali Input'
      : mode === 'preeti-to-unicode'
        ? lang === 'ne'
          ? preetiVisualTyping
            ? 'प्रीति किबोर्ड (नेपालीमा देखिने)'
            : 'प्रीति कोड (Preeti Input)'
          : preetiVisualTyping
            ? 'Preeti Typing (Nepali View)'
            : 'Preeti Code Input'
        : mode === 'unicode-to-preeti'
          ? lang === 'ne'
            ? 'युनिकोड (Unicode) पाठ'
            : 'Unicode Input'
          : `${NEPALI_FONTS.find((f) => f.id === fromFont)?.name ?? fromFont}`;

  const targetLabel =
    mode === 'romanized' || mode === 'preeti-to-unicode'
      ? lang === 'ne'
        ? 'नेपाली युनिकोड नतिजा'
        : 'Nepali Unicode Output'
      : mode === 'unicode-to-preeti'
        ? lang === 'ne'
          ? 'प्रीति (Preeti) नतिजा'
          : 'Preeti Output'
        : `${NEPALI_FONTS.find((f) => f.id === toFont)?.name ?? toFont} Output`;

  return (
    <section
      id="converter"
      aria-label="Nepali Font and Unicode Converter"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Mode Switcher + Secondary Controls */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Converter Mode"
            className="grid w-full grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:flex sm:w-auto sm:flex-wrap dark:bg-slate-800/80"
          >
            {modeTabs.map((tab) => {
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onModeChange(tab.id)}
                  className={`min-h-[42px] whitespace-nowrap shrink-0 rounded-md px-3 py-2 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
                    active
                      ? 'bg-white text-red-700 shadow-xs dark:bg-slate-900 dark:text-red-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {lang === 'ne' ? tab.ne : tab.en}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={autoConvert}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAutoConvert(checked);
                  if (!checked) setManualOutput(computedOutput);
                }}
                className="h-4 w-4 accent-red-700"
              />
              <span className="whitespace-nowrap">
                {lang === 'ne' ? 'तुरुन्त रूपान्तरण' : 'Live Convert'}
              </span>
            </label>

            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="whitespace-nowrap">
                {lang === 'ne' ? `इतिहास (${history.length})` : `History (${history.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Multi-Font Selectors or Romanized Quick Chips */}
        {mode === 'multi-font' && (
          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <div>
              <label
                htmlFor="source-font-select"
                className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                {lang === 'ne' ? 'स्रोत फन्ट (From)' : 'Source Font'}
              </label>
              <select
                id="source-font-select"
                value={fromFont}
                onChange={(e) => {
                  resetPreetiBuffer();
                  setFromFont(e.target.value as NepaliFontId);
                }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-red-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {NEPALI_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {lang === 'ne' ? font.nepaliName : font.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap source and target fonts"
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-red-600 sm:w-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <div>
              <label
                htmlFor="target-font-select"
                className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                {lang === 'ne' ? 'लक्ष्य फन्ट (To)' : 'Target Font'}
              </label>
              <select
                id="target-font-select"
                value={toFont}
                onChange={(e) => setToFont(e.target.value as NepaliFontId)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-red-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {NEPALI_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {lang === 'ne' ? font.nepaliName : font.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {mode === 'romanized' && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {lang === 'ne' ? 'उदाहरण:' : 'Try:'}
            </span>
            {ROMANIZED_EXAMPLES.map((ex) => (
              <button
                key={ex.roman}
                type="button"
                onClick={() => setInputText(ex.roman)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-red-300 hover:text-red-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-red-400"
              >
                {ex.roman}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar Above Textareas */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Sparkles className="h-3.5 w-3.5 text-red-700 dark:text-red-400" aria-hidden="true" />
            <span>{lang === 'ne' ? 'नमुना पाठ' : 'Sample'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === 'ne' ? '.TXT अपलोड' : 'Upload .TXT'}</span>
          </button>

          {mode !== 'romanized' && (
            <button
              type="button"
              onClick={handleSwap}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{lang === 'ne' ? 'साटासाट' : 'Swap'}</span>
            </button>
          )}

          <select
            aria-label={lang === 'ne' ? 'नेपाली निवेदन टेम्प्लेट' : 'Insert Nepali template'}
            value=""
            onChange={(e) => handleApplyTemplate(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">
              {lang === 'ne' ? 'निवेदन / टेम्प्लेट...' : 'Templates...'}
            </option>
            {NEPALI_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {lang === 'ne' ? tpl.labelNe : tpl.labelEn}
              </option>
            ))}
          </select>

          {undoSnapshot !== null && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{lang === 'ne' ? 'फिर्ता (Undo)' : 'Undo'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              resetPreetiBuffer();
              if (inputText) setUndoSnapshot(inputText);
              setInputText('');
              setManualOutput('');
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === 'ne' ? 'खाली' : 'Clear'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="editor-font-size"
            className="text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            {lang === 'ne' ? 'साइज:' : 'Size:'}
          </label>
          <select
            id="editor-font-size"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value={14}>14px</option>
            <option value={17}>17px</option>
            <option value={20}>20px</option>
            <option value={24}>24px</option>
          </select>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Compact editor height' : 'Expand editor height'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {!autoConvert && (
            <button
              type="button"
              onClick={handleManualConvert}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <span>{lang === 'ne' ? 'रूपान्तरण' : 'Convert'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Dual Pane Textarea Workspace */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Source Pane */}
        <div className="flex flex-col">
          <div className="flex flex-col rounded-xl border border-slate-300 bg-slate-50/70 transition-colors focus-within:border-red-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-600/15 dark:border-slate-700 dark:bg-slate-950/70 dark:focus-within:border-red-500 dark:focus-within:bg-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 px-3.5 py-2 dark:border-slate-800">
              <label
                htmlFor="converter-source-input"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                {sourceLabel}
              </label>
              <div className="flex items-center gap-1.5">
                {altDigitsPreview && (
                  <span className="font-mono-tabular text-[11px] font-semibold text-red-700 dark:text-red-400">
                    Alt+{altDigitsPreview}
                    {resolvePreetiAltCode(altDigitsPreview)
                      ? ` → ${resolvePreetiAltCode(altDigitsPreview)?.unicode}`
                      : ''}
                  </span>
                )}
                {isLegacySourceMode && (
                  <button
                    type="button"
                    onClick={handleTogglePreetiVisual}
                    className={`inline-flex min-h-[30px] items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      preetiVisualTyping
                        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {preetiVisualTyping
                      ? lang === 'ne'
                        ? 'नेपाली दृश्य (ON)'
                        : 'Nepali View (ON)'
                      : lang === 'ne'
                        ? 'कोड मोड (g]kfn)'
                        : 'Raw Code (g]kfn)'}
                  </button>
                )}

                {isUnicodeSourceMode && (
                  <select
                    aria-label="Input keyboard typing mode"
                    value={unicodeInputHelper}
                    onChange={(e) => {
                      resetPreetiBuffer();
                      setUnicodeInputHelper(
                        e.target.value as 'direct' | 'preeti' | 'romanized',
                      );
                    }}
                    className="h-[30px] rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="preeti">
                      {lang === 'ne' ? 'Preeti किबोर्ड' : 'Preeti Keys'}
                    </option>
                    <option value="romanized">
                      {lang === 'ne' ? 'Romanized टाइप' : 'Romanized Type'}
                    </option>
                    <option value="direct">
                      {lang === 'ne' ? 'सिधा युनिकोड' : 'Direct Unicode'}
                    </option>
                  </select>
                )}

                <button
                  type="button"
                  onClick={handlePasteButton}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {pasted ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>
                    {pasted
                      ? lang === 'ne'
                        ? 'पेस्ट भयो'
                        : 'Pasted'
                      : lang === 'ne'
                        ? 'पेस्ट'
                        : 'Paste'}
                  </span>
                </button>
              </div>
            </div>
            <textarea
              ref={inputRef}
              id="converter-source-input"
              value={inputText}
              onKeyDown={handleInputKeyDown}
              onKeyUp={handleInputKeyUp}
              onChange={handleInputChange}
              onPaste={handleInputPaste}
              onClick={() => resetPreetiBuffer()}
              rows={expanded ? 15 : 9}
              style={{fontSize: `${fontSize}px`}}
              placeholder={
                mode === 'romanized'
                  ? 'Type here: namaste nepal, kasto chha?'
                  : isUnicodeSourceMode && unicodeInputHelper === 'romanized'
                    ? 'Romanized मा टाइप गर्नुहोस् (उदाहरण: mero desh nepal)...'
                    : isVisualPreetiActive
                      ? 'प्रीति किबोर्डबाट सिधै नेपालीमा टाइप गर्नुहोस् (उदाहरण: g]kfn → नेपाल)...'
                      : 'Paste Preeti code here (e.g. g]kfn)...'
              }
              className={`font-nepali w-full resize-y bg-transparent p-3.5 leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 ${
                expanded ? 'min-h-[380px]' : 'min-h-[230px]'
              }`}
            />
          </div>

          {/* Character and Word Count Indicator Below Input Area */}
          <div
            aria-live="polite"
            className="font-mono-tabular mt-1.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400"
          >
            <span>
              {lang === 'ne' ? 'इनपुट लम्बाइ:' : 'Input length:'}{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                {inputMetrics.characters}
              </strong>{' '}
              {lang === 'ne' ? 'अक्षर' : 'chars'} ·{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                {inputMetrics.words}
              </strong>{' '}
              {lang === 'ne' ? 'शब्द' : 'words'} · {inputMetrics.lines}{' '}
              {lang === 'ne' ? 'लाइन' : 'lines'}
            </span>
            <span>
              {inputMetrics.charactersNoSpaces}{' '}
              {lang === 'ne' ? 'अक्षर (खाली ठाउँ बिना)' : 'no spaces'}
            </span>
          </div>
        </div>

        {/* Output Pane with Embedded Copy to Clipboard Button + Visual Feedback */}
        <div className="flex flex-col">
          <div
            className={`flex flex-col rounded-xl border transition-colors ${
              copied
                ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 dark:border-emerald-500/80 dark:bg-emerald-950/10'
                : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 px-3.5 py-2 dark:border-slate-800">
              <label
                htmlFor="converter-target-output"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                {targetLabel}
              </label>
              <div className="flex items-center gap-1.5">
                {isLegacyOutput && (
                  <button
                    type="button"
                    onClick={() => setOutputVisualNepali((v) => !v)}
                    className={`inline-flex min-h-[30px] items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      outputVisualNepali
                        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {outputVisualNepali
                      ? lang === 'ne'
                        ? 'नेपाली दृश्य (ON)'
                        : 'Nepali View (ON)'
                      : lang === 'ne'
                        ? 'फन्ट कोड (g]kfn)'
                        : 'Font Code (g]kfn)'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePrintClick}
                  disabled={!displayedOutput}
                  aria-label={lang === 'ne' ? 'नतिजा प्रिन्ट गर्नुहोस्' : 'Print output'}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {lang === 'ne' ? 'प्रिन्ट' : 'Print'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!activeOutput}
                  aria-live="polite"
                  className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-red-700 text-white hover:bg-red-800'
                  }`}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>
                    {copied
                      ? lang === 'ne'
                        ? 'कपी भयो!'
                        : 'Copied!'
                      : isLegacyOutput
                        ? lang === 'ne'
                          ? 'फन्ट कोड कपी'
                          : 'Copy Font Code'
                        : lang === 'ne'
                          ? 'कपी गर्नुहोस्'
                          : 'Copy to Clipboard'}
                  </span>
                </button>
              </div>
            </div>

            <div className="relative flex-1">
              <textarea
                id="converter-target-output"
                readOnly
                value={displayedOutput}
                rows={expanded ? 15 : 9}
                style={{fontSize: `${fontSize}px`}}
                placeholder={
                  lang === 'ne'
                    ? 'रूपान्तरण भएको नतिजा यहाँ देखिनेछ...'
                    : 'Converted result appears here...'
                }
                className={`font-nepali w-full resize-y bg-transparent p-3.5 pb-12 leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 ${
                  expanded ? 'min-h-[380px]' : 'min-h-[230px]'
                }`}
              />

              {/* Floating Bottom-Right Visual Copy Feedback inside Output Area */}
              {activeOutput && copied && (
                <div className="pointer-events-none absolute right-3 bottom-3">
                  <span className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                    {isLegacyOutput
                      ? lang === 'ne'
                        ? 'Preeti/फन्ट कोड कपी भयो'
                        : 'Font code copied to clipboard'
                      : lang === 'ne'
                        ? 'क्लिपबोर्डमा कपी भयो'
                        : 'Copied to clipboard'}
                  </span>
                </div>
              )}
            </div>

            {/* Underlying Font Code / Nepali Verification Strip for Legacy Outputs */}
            {isLegacyOutput && activeOutput && (
              <div className="border-t border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
                {outputVisualNepali ? (
                  <>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {lang === 'ne'
                        ? 'MS Word / Photoshop को लागि कपी हुने फन्ट कोड:'
                        : 'Font code copied for MS Word / DTP:'}
                    </div>
                    <p className="font-mono-tabular mt-0.5 line-clamp-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {activeOutput}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {lang === 'ne'
                        ? 'नेपाली अक्षर जाँच:'
                        : 'Nepali Visual Check:'}
                    </div>
                    <p className="font-nepali mt-0.5 line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {outputNepaliPreview}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Character and Word Count Indicator Below Output Area */}
          <div className="font-mono-tabular mt-1.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {lang === 'ne' ? 'नतिजा लम्बाइ:' : 'Output length:'}{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                {outputMetrics.characters}
              </strong>{' '}
              {lang === 'ne' ? 'अक्षर' : 'chars'} ·{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                {outputMetrics.words}
              </strong>{' '}
              {lang === 'ne' ? 'शब्द' : 'words'} · {outputMetrics.lines}{' '}
              {lang === 'ne' ? 'लाइन' : 'lines'}
            </span>
            <span>{utf8Bytes} UTF-8 B</span>
          </div>
        </div>
      </div>

      {/* Output Actions + Text Cleanup Utilities */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!activeOutput}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
              copied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-700 hover:bg-red-800'
            }`}
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {copied
                ? lang === 'ne'
                  ? 'कपी भयो!'
                  : 'Copied!'
                : lang === 'ne'
                  ? 'नतिजा कपी गर्नुहोस्'
                  : 'Copy Output'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={!activeOutput}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>.TXT</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDoc}
            disabled={!activeOutput}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Word (.DOC)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintClick}
            disabled={!displayedOutput}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === 'ne' ? 'प्रिन्ट' : 'Print'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyOutputTransform('to-ne-digits')}
            className="min-h-[38px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            0-9 → ०-९
          </button>
          <button
            type="button"
            onClick={() => applyOutputTransform('to-en-digits')}
            className="min-h-[38px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ०-९ → 0-9
          </button>
          <button
            type="button"
            onClick={() => applyOutputTransform('clean')}
            className="min-h-[38px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {lang === 'ne' ? 'खाली ठाउँ सफा' : 'Clean Spaces'}
          </button>
          <button
            type="button"
            onClick={() => applyOutputTransform('sort')}
            className="min-h-[38px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {lang === 'ne' ? 'क्रमबद्ध (अ–ज्ञ)' : 'Sort Lines'}
          </button>
          <button
            type="button"
            onClick={() => applyOutputTransform('dedupe')}
            className="min-h-[38px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {lang === 'ne' ? 'दोहोरिएको हटाउनुहोस्' : 'Dedupe Lines'}
          </button>
        </div>
      </div>

      {/* Quick Insert Special Nepali Symbols & Alt+Code Shortcuts */}
      <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {lang === 'ne' ? 'छिटो थप्नुहोस्:' : 'Quick Insert:'}
            </span>
            {QUICK_SYMBOLS.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => handleInsertSymbol(sym)}
                className="font-nepali min-h-[34px] min-w-[34px] rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-800 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-red-500/50 dark:hover:text-red-400"
              >
                {sym}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAltPalette((v) => !v)}
            className={`min-h-[34px] whitespace-nowrap rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${
              showAltPalette
                ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {lang === 'ne'
              ? showAltPalette
                ? 'Alt+Code लुकाउनुहोस्'
                : 'Alt+0xxx सर्टकटहरू'
              : showAltPalette
                ? 'Hide Alt+Codes'
                : 'Alt+0xxx Shortcuts'}
          </button>
        </div>

        {showAltPalette && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>
                {lang === 'ne'
                  ? 'किबोर्डमा Alt थिचेर नम्बर (जस्तै Alt+0170) टाइप गर्नुहोस् वा तलको अक्षरमा क्लिक गर्नुहोस्:'
                  : 'Hold Alt + type digits (e.g. Alt+0170) in the editor, or click any shortcut below to insert:'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {PREETI_ALT_CODES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() =>
                    handleInsertSymbol(
                      isLegacySourceMode && !preetiVisualTyping
                        ? item.asciiChar
                        : item.unicode,
                    )
                  }
                  className="flex min-h-[42px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left transition-colors hover:border-red-300 hover:bg-red-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-red-500/50"
                >
                  <span className="font-nepali text-base font-bold text-red-700 dark:text-red-400">
                    {item.unicode}
                  </span>
                  <span className="font-mono-tabular text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {item.altLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Local Conversion History Drawer */}
      {showHistory && (
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {lang === 'ne'
                ? 'हालसालैका ५ रूपान्तरण (तपाईंको ब्राउजरमा मात्र सुरक्षित)'
                : 'Last 5 Conversions (Saved Locally in Your Browser)'}
            </h3>
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-xs font-medium text-red-700 hover:underline dark:text-red-400"
              >
                {lang === 'ne' ? 'सबै हटाउनुहोस्' : 'Clear All'}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ne'
                ? 'तपाईंले पाठ रूपान्तरण, कपी वा डाउनलोड गरेपछि यहाँ इतिहास देखिनेछ।'
                : 'Your last 5 converted snippets will appear here.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <button
                    type="button"
                    onClick={() => {
                      resetPreetiBuffer();
                      setUndoSnapshot(inputText);
                      if (item.mode !== mode) {
                        skipNextModeResetRef.current = true;
                        onModeChange(item.mode);
                      }
                      setFromFont(item.fromFont || 'preeti');
                      setToFont(item.toFont || 'unicode');
                      setInputText(item.input);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {item.sourceLabel} → {item.targetLabel} · {item.createdAt}
                    </span>
                    <span className="font-nepali mt-1 line-clamp-1 block text-xs font-medium text-slate-800 dark:text-slate-200">
                      {item.previewText || item.output}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveHistoryItem(item.id)}
                    aria-label={lang === 'ne' ? 'हटाउनुहोस्' : 'Remove item'}
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
