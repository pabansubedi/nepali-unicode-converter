import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowLeftRight,
  Check,
  ClipboardPaste,
  Code2,
  Copy,
  Download,
  FileText,
  Maximize2,
  Minimize2,
  Printer,
  Search,
  Sparkles,
  Terminal,
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
  detectMostLikelySourceFont,
  NEPALI_FONTS,
  type NepaliFontId,
  PREETI_ALT_CODES,
  preetiToUnicode,
  resolveExtendedPreetiChar,
  resolvePreetiAltCode,
  sortNepaliLines,
  toEnglishDigits,
  toNepaliDigits,
} from '../utils/preetiEngine';
import {
  ROMANIZED_EXAMPLES,
  romanizedToUnicode,
} from '../utils/romanizedEngine';
import {CodeInspectorDrawer} from './CodeInspectorDrawer';
import {
  CommandPaletteModal,
  type PaletteActionKind,
} from './CommandPaletteModal';

export type {WorkspaceMode};

interface ConverterWorkspaceProps {
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  lang: 'en' | 'ne';
  bsDateText: string;
  onSaveHistory: (item: HistoryItem) => void;
  restoreRequest?: {item: HistoryItem; nonce: number} | null;
  onPrintOutput?: (text: string) => void;
  onToggleTheme?: () => void;
  onToggleLang?: () => void;
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
  'g]kfn Ps ;\'Gb/ lxdfnL b]z xf] . k|ljlw / 1fgsf] ljsf;n] xfd|f] ;dfhnfO{ cufl8 a9fpF5 .';
const SAMPLE_UNICODE =
  'नेपाल एक सुन्दर हिमाली देश हो । प्रविधि र ज्ञानको विकासले हाम्रो समाजलाई अगाडि बढाउँछ ।';
const SAMPLE_ROMANIZED =
  'namaste! mero desh nepal ho. aaja ko prabidhi ra gyan le hamro samaj lai aagadi badhaauchha.';

export function ConverterWorkspace({
  mode,
  onModeChange,
  lang,
  bsDateText,
  onSaveHistory,
  restoreRequest,
  onPrintOutput,
  onToggleTheme,
  onToggleLang,
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
  const [altSearch, setAltSearch] = useState<string>('');
  const [showFindBar, setShowFindBar] = useState<boolean>(false);
  const [findPattern, setFindPattern] = useState<string>('');
  const [replacePattern, setReplacePattern] = useState<string>('');
  const [findRegexMode, setFindRegexMode] = useState<boolean>(true);
  const [findCaseSensitive, setFindCaseSensitive] = useState<boolean>(false);
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [altDigitsPreview, setAltDigitsPreview] = useState<string>('');
  const [undoSnapshot, setUndoSnapshot] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Word-level buffer for live Preeti keystroke -> Nepali Devanagari rendering
  const preetiBufferRef = useRef<string>('');
  const wordStartRef = useRef<number>(0);
  const wordEndRef = useRef<number>(0);
  const altDigitsRef = useRef<string>('');
  const altConsumedRef = useRef<boolean>(false);
  const isAltHeldRef = useRef<boolean>(false);
  const pendingAltEchoUntilRef = useRef<number>(0);
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

  const sourceFontDetection = useMemo(() => {
    if (mode !== 'multi-font') return null;
    return detectMostLikelySourceFont(inputText);
  }, [mode, inputText]);

  const showSourceFontSuggestion = useMemo(() => {
    if (mode !== 'multi-font' || !sourceFontDetection?.suggestedFont) {
      return false;
    }
    if (sourceFontDetection.suggestedFont === 'preeti') {
      return fromFont === 'unicode';
    }
    // Suggest Unicode when legacy font is selected and user pasted/entered Devanagari
    if (fromFont !== 'unicode') {
      if (preetiVisualTyping && inputText === SAMPLE_UNICODE) {
        return false;
      }
      return true;
    }
    return false;
  }, [mode, sourceFontDetection, fromFont, preetiVisualTyping, inputText]);

  const handleApplySuggestedSourceFont = () => {
    if (!sourceFontDetection?.suggestedFont) return;
    resetPreetiBuffer();
    const suggested = sourceFontDetection.suggestedFont;
    if (suggested === 'unicode') {
      if (toFont === 'unicode') {
        setToFont(fromFont !== 'unicode' ? fromFont : 'preeti');
      }
      setFromFont('unicode');
      setUnicodeInputHelper('direct');
    } else {
      if (toFont === 'preeti') {
        setToFont('unicode');
      }
      setFromFont('preeti');
    }
  };

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
    setUndoSnapshot(inputText);
    const nextInput = activeOutput;
    if (mode === 'preeti-to-unicode') {
      skipNextModeResetRef.current = true;
      onModeChange('unicode-to-preeti');
      setFromFont('unicode');
      setToFont('preeti');
    } else if (mode === 'unicode-to-preeti') {
      skipNextModeResetRef.current = true;
      onModeChange('preeti-to-unicode');
      setFromFont('preeti');
      setToFont('unicode');
      setPreetiVisualTyping(false);
    } else {
      const prevFrom = fromFont;
      setFromFont(toFont);
      setToFont(prevFrom);
      if (toFont !== 'unicode') {
        setPreetiVisualTyping(false);
      }
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

  const commitAltCodeInsert = (digits: string): boolean => {
    const match = resolvePreetiAltCode(digits);
    if (!match) return false;

    // Guard against native OS WM_CHAR / Option-key echo after our handler already inserted
    pendingAltEchoUntilRef.current = isAltHeldRef.current
      ? Number.POSITIVE_INFINITY
      : Date.now() + 450;

    if (isLegacySourceMode && !preetiVisualTyping) {
      handleInsertSymbol(match.asciiChar);
      return true;
    }

    const el = inputRef.current;
    if (
      isVisualPreetiActive &&
      el &&
      preetiBufferRef.current.endsWith('l') &&
      /^[\u0915-\u0939]/.test(match.unicode)
    ) {
      const selStart = el.selectionStart ?? inputText.length;
      const selEnd = el.selectionEnd ?? inputText.length;
      if (selStart === selEnd && inputText.slice(0, selStart).endsWith('\u093F')) {
        resetPreetiBuffer();
        const combined = `${match.unicode}\u093F`;
        const nextValue =
          inputText.slice(0, selStart - 1) + combined + inputText.slice(selEnd);
        const nextCaret = selStart - 1 + combined.length;
        setInputText(nextValue);
        window.requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(nextCaret, nextCaret);
        });
        return true;
      }
    }

    handleInsertSymbol(match.unicode);
    return true;
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Capture Alt + 0xxx shortcut codes reliably across Numpad (NumLock on/off), top-row Digits, Mac Option, and Right-Alt (AltGraph)
    const isAltGraph = Boolean(e.getModifierState?.('AltGraph'));
    const isAltPressed = e.altKey || isAltGraph;
    isAltHeldRef.current = isAltPressed;

    if (
      !isAltPressed &&
      e.key !== 'Alt' &&
      e.key !== 'AltGraph' &&
      e.key !== 'Shift' &&
      e.key !== 'Control' &&
      e.key !== 'Meta' &&
      e.key !== 'Process' &&
      e.key !== 'Unidentified'
    ) {
      pendingAltEchoUntilRef.current = 0;
    }

    if (isAltPressed && (!e.ctrlKey || isAltGraph) && !e.metaKey) {
      const codeDigitMatch = /^(?:Digit|Numpad)([0-9])$/.exec(e.code);
      const altDigit = /^[0-9]$/.test(e.key)
        ? e.key
        : (codeDigitMatch?.[1] ?? null);

      if (altDigit !== null) {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) {
          return;
        }
        altConsumedRef.current = true;
        const nextDigits = (altDigitsRef.current + altDigit).slice(0, 4);
        altDigitsRef.current = nextDigits;
        setAltDigitsPreview(nextDigits);
        if (nextDigits.length === 4) {
          commitAltCodeInsert(nextDigits);
          altDigitsRef.current = '';
          setAltDigitsPreview('');
        }
        return;
      }

      if (e.key === 'Backspace' && altDigitsRef.current.length > 0) {
        e.preventDefault();
        const trimmed = altDigitsRef.current.slice(0, -1);
        altDigitsRef.current = trimmed;
        setAltDigitsPreview(trimmed);
        return;
      }

      if (
        e.key === 'Escape' &&
        (altDigitsRef.current.length > 0 || altConsumedRef.current)
      ) {
        e.preventDefault();
        altDigitsRef.current = '';
        altConsumedRef.current = false;
        setAltDigitsPreview('');
        return;
      }

      if (
        e.key !== 'Alt' &&
        e.key !== 'AltGraph' &&
        e.key !== 'Shift' &&
        e.key !== 'Control' &&
        e.key !== 'Meta' &&
        e.key !== 'NumLock'
      ) {
        altDigitsRef.current = '';
        setAltDigitsPreview('');
      }
    }

    if (!isVisualPreetiActive) return;
    const el = e.currentTarget;

    if (e.ctrlKey || e.metaKey || isAltPressed) return;

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
    if (e.key === 'Alt' || e.key === 'AltGraph') {
      isAltHeldRef.current = false;
      if (altConsumedRef.current || altDigitsRef.current) {
        e.preventDefault();
      }
      if (altDigitsRef.current) {
        commitAltCodeInsert(altDigitsRef.current);
        altDigitsRef.current = '';
        setAltDigitsPreview('');
      } else if (pendingAltEchoUntilRef.current === Number.POSITIVE_INFINITY) {
        pendingAltEchoUntilRef.current = Date.now() + 450;
      }
      altConsumedRef.current = false;
    }
  };

  const handleInputBeforeInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const native = e.nativeEvent as InputEvent | undefined;
    const data = native?.data ?? '';
    if (!data || data.length > 2) return;
    if (isAltHeldRef.current || Date.now() <= pendingAltEchoUntilRef.current) {
      e.preventDefault();
      pendingAltEchoUntilRef.current = 0;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    const caret = e.target.selectionStart ?? nextVal.length;

    // Discard delayed OS-synthesized Alt+Numpad / Option characters when our handler already committed
    if (
      Date.now() <= pendingAltEchoUntilRef.current &&
      nextVal.length > inputText.length &&
      nextVal.length <= inputText.length + 2
    ) {
      const el = e.target;
      const added = nextVal.length - inputText.length;
      const restoredCaret = Math.max(0, caret - added);
      pendingAltEchoUntilRef.current = 0;
      setInputText(inputText);
      window.requestAnimationFrame(() => {
        el.setSelectionRange(restoredCaret, restoredCaret);
      });
      return;
    }

    // Fallback when OS (Windows Numpad Alt+0xxx or Mac Option) inserts a Latin-1 / Windows-1252 Preeti glyph natively
    if (caret > 0 && (isVisualPreetiActive || isUnicodeSourceMode)) {
      const inserted = nextVal[caret - 1];
      const extUnicode = inserted ? resolveExtendedPreetiChar(inserted) : null;
      if (extUnicode) {
        resetPreetiBuffer();
        const el = e.target;
        const fixedVal =
          nextVal.slice(0, caret - 1) + extUnicode + nextVal.slice(caret);
        const nextCaret = caret - 1 + extUnicode.length;
        setInputText(fixedVal);
        window.requestAnimationFrame(() => {
          el.setSelectionRange(nextCaret, nextCaret);
        });
        return;
      }
    }

    if (nextVal.length === inputText.length + 1) {
      const inserted = nextVal[caret - 1];
      if (inserted) {

        const code = inserted.charCodeAt(0);
        if (isVisualPreetiActive && code >= 33 && code <= 126) {
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
      if (isVisualPreetiActive) {
        resetPreetiBuffer();
      }
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
      saveSnippetToHistory(activeOutput);
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

  // Regex Find & Replace helpers
  const findStats = useMemo(() => {
    if (!findPattern) return {count: 0, error: false};
    try {
      const flags = findCaseSensitive ? 'g' : 'gi';
      const escaped = findPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(findRegexMode ? findPattern : escaped, flags);
      const matches = inputText.match(regex);
      return {count: matches ? matches.length : 0, error: false};
    } catch {
      return {count: 0, error: true};
    }
  }, [findPattern, findRegexMode, findCaseSensitive, inputText]);

  const handleReplaceAll = () => {
    if (!findPattern || findStats.error) return;
    try {
      const flags = findCaseSensitive ? 'g' : 'gi';
      const escaped = findPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(findRegexMode ? findPattern : escaped, flags);
      setUndoSnapshot(inputText);
      setInputText((prev) => prev.replace(regex, replacePattern));
    } catch {
      // ignore invalid regex
    }
  };

  const filteredAltCodes = useMemo(() => {
    const q = altSearch.trim().toLowerCase();
    if (!q) return PREETI_ALT_CODES;
    return PREETI_ALT_CODES.filter(
      (item) =>
        item.code.includes(q) ||
        item.altLabel.toLowerCase().includes(q) ||
        item.unicode.includes(q) ||
        item.labelEn.toLowerCase().includes(q) ||
        item.labelNe.toLowerCase().includes(q),
    );
  }, [altSearch]);

  const latestActionsRef = useRef({
    handleCopy,
    handleSwap,
    applyOutputTransform,
    clearEditor: () => {
      resetPreetiBuffer();
      if (inputText) setUndoSnapshot(inputText);
      setInputText('');
      setManualOutput('');
    },
    toggleTheme: () => onToggleTheme?.(),
    toggleLang: () => onToggleLang?.(),
  });
  latestActionsRef.current = {
    handleCopy,
    handleSwap,
    applyOutputTransform,
    clearEditor: () => {
      resetPreetiBuffer();
      if (inputText) setUndoSnapshot(inputText);
      setInputText('');
      setManualOutput('');
    },
    toggleTheme: () => onToggleTheme?.(),
    toggleLang: () => onToggleLang?.(),
  };

  const handlePaletteAction = useCallback((kind: PaletteActionKind) => {
    const acts = latestActionsRef.current;
    if (kind === 'copy') {
      void acts.handleCopy();
    } else if (kind === 'swap') {
      acts.handleSwap();
    } else if (kind === 'clear') {
      acts.clearEditor();
    } else if (kind === 'find') {
      setShowFindBar((v) => !v);
    } else if (kind === 'inspector') {
      setShowInspector((v) => !v);
    } else if (kind === 'alt-list') {
      setShowAltPalette((v) => !v);
    } else if (kind === 'theme') {
      acts.toggleTheme();
    } else if (kind === 'lang') {
      acts.toggleLang();
    } else {
      acts.applyOutputTransform(kind);
    }
  }, []);

  // Global Hacker Keyboard Shortcuts (Ctrl+K, Ctrl+Shift+C/S/F/I)
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const lower = e.key.toLowerCase();
      if (lower === 'k' && !e.shiftKey) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.shiftKey && lower === 'f') {
        e.preventDefault();
        setShowFindBar((v) => !v);
      } else if (e.shiftKey && lower === 'i') {
        e.preventDefault();
        setShowInspector((v) => !v);
      } else if (e.shiftKey && lower === 'c') {
        e.preventDefault();
        void latestActionsRef.current.handleCopy();
      } else if (e.shiftKey && lower === 's') {
        e.preventDefault();
        latestActionsRef.current.handleSwap();
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, []);

  const modeTabs: Array<{id: WorkspaceMode; en: string; ne: string}> = [
    {id: 'preeti-to-unicode', en: 'Preeti → Unicode', ne: 'प्रीति → युनिकोड'},
    {id: 'unicode-to-preeti', en: 'Unicode → Preeti', ne: 'युनिकोड → प्रीति'},
    {id: 'multi-font', en: 'Multi-Font', ne: 'अन्य फन्टहरू'},
    {id: 'romanized', en: 'Romanized → Nepali', ne: 'रोमनाइज्ड → नेपाली'},
  ];

  const sourceLabel =
    mode === 'romanized'
      ? lang === 'ne'
        ? 'रोमन नेपाली टाइप'
        : 'Romanized Input'
      : mode === 'preeti-to-unicode'
        ? lang === 'ne'
          ? 'प्रीति इनपुट'
          : 'Preeti Input'
        : mode === 'unicode-to-preeti'
          ? lang === 'ne'
            ? 'युनिकोड पाठ'
            : 'Unicode Input'
          : `${NEPALI_FONTS.find((f) => f.id === fromFont)?.name ?? fromFont}`;

  const targetLabel =
    mode === 'romanized' || mode === 'preeti-to-unicode'
      ? lang === 'ne'
        ? 'नेपाली युनिकोड नतिजा'
        : 'Nepali Unicode Output'
      : mode === 'unicode-to-preeti'
        ? lang === 'ne'
          ? 'प्रीति फन्ट नतिजा'
          : 'Preeti Font Output'
        : `${NEPALI_FONTS.find((f) => f.id === toFont)?.name ?? toFont} Output`;

  return (
    <section
      id="converter"
      aria-label="Nepali Font and Unicode Converter"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#0D131F]"
    >
      {/* Top Mode Switcher & Studio View Controls */}
      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Converter Mode"
            className="grid w-full grid-cols-2 gap-1 rounded-xl border border-slate-200/70 bg-slate-100/90 p-1 sm:flex sm:w-auto sm:flex-wrap dark:border-slate-800 dark:bg-[#070A11]"
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
                  className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
                    active
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                  }`}
                >
                  {lang === 'ne' ? tab.ne : tab.en}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={autoConvert}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAutoConvert(checked);
                  if (!checked) setManualOutput(computedOutput);
                }}
                className="h-4 w-4 rounded accent-red-700"
              />
              <span className="whitespace-nowrap">
                {lang === 'ne' ? 'तुरुन्त रूपान्तरण' : 'Live Convert'}
              </span>
            </label>

            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2.5 dark:border-slate-700">
              <label
                htmlFor="editor-font-size"
                className="text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {lang === 'ne' ? 'साइज' : 'Size'}
              </label>
              <select
                id="editor-font-size"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="h-8 rounded-lg border border-slate-200 bg-slate-50/70 px-2 text-xs font-medium text-slate-700 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
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
                title={expanded ? 'Compact height' : 'Expand height'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {expanded ? (
                  <Minimize2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Font Selectors or Romanized Quick Examples */}
        {mode === 'multi-font' && (
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label
                    htmlFor="source-font-select"
                    className="block text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    {lang === 'ne' ? 'स्रोत फन्ट (From)' : 'Source Font'}
                  </label>
                  {sourceFontDetection?.suggestedFont && !showSourceFontSuggestion && (
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      {sourceFontDetection.suggestedFont === 'unicode'
                        ? lang === 'ne'
                          ? 'पहिचान: युनिकोड'
                          : 'Detected: Unicode'
                        : lang === 'ne'
                          ? 'पहिचान: प्रीति ढाँचा'
                          : 'Detected: Preeti'}
                    </span>
                  )}
                </div>
                <select
                  id="source-font-select"
                  value={fromFont}
                  onChange={(e) => {
                    resetPreetiBuffer();
                    setFromFont(e.target.value as NepaliFontId);
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-red-600 sm:w-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <div>
                <label
                  htmlFor="target-font-select"
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  {lang === 'ne' ? 'लक्ष्य फन्ट (To)' : 'Target Font'}
                </label>
                <select
                  id="target-font-select"
                  value={toFont}
                  onChange={(e) => setToFont(e.target.value as NepaliFontId)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {NEPALI_FONTS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {lang === 'ne' ? font.nepaliName : font.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showSourceFontSuggestion && sourceFontDetection?.suggestedFont && (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/90 px-3.5 py-2.5 text-xs dark:border-indigo-800/70 dark:bg-indigo-950/50"
              >
                <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-100">
                  <Sparkles
                    className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-semibold">
                      {sourceFontDetection.suggestedFont === 'unicode'
                        ? lang === 'ne'
                          ? 'सुझाव: स्रोत फन्ट युनिकोड (Unicode) हुनुपर्छ'
                          : 'Suggestion: Input looks like Unicode (Devanagari)'
                        : lang === 'ne'
                          ? 'सुझाव: स्रोत फन्ट प्रीति (Preeti) हुनुपर्छ'
                          : 'Suggestion: Input looks like Preeti font text'}
                    </strong>{' '}
                    <span className="text-indigo-700 dark:text-indigo-300">
                      ·{' '}
                      {lang === 'ne'
                        ? sourceFontDetection.reasonNe
                        : sourceFontDetection.reasonEn}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplySuggestedSourceFont}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {sourceFontDetection.suggestedFont === 'unicode'
                    ? lang === 'ne'
                      ? 'युनिकोडमा बदल्नुहोस्'
                      : 'Switch to Unicode'
                    : lang === 'ne'
                      ? 'प्रीतिमा बदल्नुहोस्'
                      : 'Switch to Preeti'}
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'romanized' && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="mr-1 font-medium text-slate-700 dark:text-slate-300">
              {lang === 'ne' ? 'उदाहरण:' : 'Try:'}
            </span>
            {ROMANIZED_EXAMPLES.map((ex) => (
              <button
                key={ex.roman}
                type="button"
                onClick={() => setInputText(ex.roman)}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                {ex.roman}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quiet Ghost Toolbar Above Unified Studio */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Sparkles className="h-3.5 w-3.5 text-red-700 dark:text-red-400" aria-hidden="true" />
            <span>{lang === 'ne' ? 'नमुना पाठ' : 'Sample'}</span>
          </button>

          <select
            aria-label={lang === 'ne' ? 'नेपाली निवेदन टेम्प्लेट' : 'Insert Nepali template'}
            value=""
            onChange={(e) => handleApplyTemplate(e.target.value)}
            className="h-9 rounded-lg border border-slate-200/90 bg-slate-50/70 px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
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
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === 'ne' ? '.TXT अपलोड' : 'Upload .TXT'}</span>
          </button>

          {mode !== 'romanized' && (
            <button
              type="button"
              onClick={handleSwap}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{lang === 'ne' ? 'साटासाट' : 'Swap'}</span>
            </button>
          )}

          {undoSnapshot !== null && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{lang === 'ne' ? 'फिर्ता' : 'Undo'}</span>
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
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === 'ne' ? 'खाली' : 'Clear'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowFindBar((v) => !v)}
            title="Ctrl+Shift+F"
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              showFindBar
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === 'ne' ? 'Find / Regex' : 'Find / Regex'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInspector((v) => !v)}
            title="Ctrl+Shift+I"
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              showInspector
                ? 'bg-slate-900 text-emerald-400 dark:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === 'ne' ? 'कोड इन्स्पेक्टर' : 'Inspector'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            title="Ctrl+K"
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Terminal className="h-3.5 w-3.5 text-red-700 dark:text-red-400" aria-hidden="true" />
            <kbd className="font-mono-tabular text-[11px]">Ctrl+K</kbd>
          </button>

          {!autoConvert && (
            <button
              type="button"
              onClick={handleManualConvert}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-red-700 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <span>{lang === 'ne' ? 'रूपान्तरण गर्नुहोस्' : 'Convert Now'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Regex Find & Replace Power Bar */}
      {showFindBar && (
        <div
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setShowFindBar(false);
            }
          }}
          className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 p-2.5 dark:border-slate-800 dark:bg-[#080C14]"
        >
          <div className="flex min-w-[180px] flex-1 items-center gap-1.5">
            <input
              type="text"
              value={findPattern}
              onChange={(e) => setFindPattern(e.target.value)}
              placeholder={lang === 'ne' ? 'खोज्नुहोस् (Regex/Text)...' : 'Find pattern...'}
              className="font-mono-tabular h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => setFindRegexMode((v) => !v)}
              title="Use Regular Expression"
              className={`font-mono-tabular h-9 rounded-lg border px-2 text-xs font-bold transition-colors ${
                findRegexMode
                  ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300'
                  : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              .*
            </button>
            <button
              type="button"
              onClick={() => setFindCaseSensitive((v) => !v)}
              title="Match Case"
              className={`font-mono-tabular h-9 rounded-lg border px-2 text-xs font-bold transition-colors ${
                findCaseSensitive
                  ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300'
                  : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              Aa
            </button>
          </div>

          <input
            type="text"
            value={replacePattern}
            onChange={(e) => setReplacePattern(e.target.value)}
            placeholder={lang === 'ne' ? 'यसले बदल्नुहोस्...' : 'Replace with...'}
            className="font-mono-tabular h-9 min-w-[160px] flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <div className="flex items-center gap-2">
            <span
              className={`font-mono-tabular text-[11px] font-medium ${
                findStats.error
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {findStats.error
                ? lang === 'ne'
                  ? 'गलत Regex'
                  : 'Invalid regex'
                : `${findStats.count} ${lang === 'ne' ? 'मिल्यो' : 'matches'}`}
            </span>
            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={!findPattern || findStats.error || findStats.count === 0}
              className="h-9 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {lang === 'ne' ? 'सबै बदल्नुहोस्' : 'Replace All'}
            </button>
          </div>
        </div>
      )}

      {/* Unified Split-Pane Studio Container */}
      <div className="mt-3 grid grid-cols-1 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 xl:grid-cols-2 xl:divide-x xl:divide-y-0 dark:divide-slate-800 dark:border-slate-800">
        {/* Left Pane: Source Input */}
        <div className="flex flex-col bg-indigo-50/35 transition-colors focus-within:bg-white dark:bg-[#080D1A] dark:focus-within:bg-[#0B1224]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/75 bg-indigo-50/40 px-4 py-2.5 dark:border-slate-800 dark:bg-[#0C1324]">
            <label
              htmlFor="converter-source-input"
              className="text-xs font-bold tracking-tight text-indigo-800 dark:text-indigo-300"
            >
              {sourceLabel}
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              {altDigitsPreview && (
                <span className="font-mono-tabular text-[11px] font-semibold text-red-700 dark:text-red-400">
                  Alt+{altDigitsPreview}
                  {resolvePreetiAltCode(altDigitsPreview)
                    ? ` → ${resolvePreetiAltCode(altDigitsPreview)?.unicode}`
                    : ''}
                </span>
              )}

              {isLegacySourceMode && (
                <div
                  role="group"
                  aria-label="Preeti input display style"
                  className="inline-flex items-center rounded-lg bg-slate-200/70 p-0.5 dark:bg-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!preetiVisualTyping) handleTogglePreetiVisual();
                    }}
                    className={`min-h-[28px] rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                      preetiVisualTyping
                        ? 'bg-white text-red-700 shadow-xs dark:bg-slate-900 dark:text-red-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'ne' ? 'नेपाली टाइप' : 'Nepali Keys'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (preetiVisualTyping) handleTogglePreetiVisual();
                    }}
                    className={`min-h-[28px] rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                      !preetiVisualTyping
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'ne' ? 'प्रीति पेस्ट' : 'Raw Preeti'}
                  </button>
                </div>
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
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
                className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
            onBeforeInput={handleInputBeforeInput}
            onKeyDown={handleInputKeyDown}
            onKeyUp={handleInputKeyUp}
            onChange={handleInputChange}
            onPaste={handleInputPaste}
            onBlur={() => {
              altDigitsRef.current = '';
              altConsumedRef.current = false;
              isAltHeldRef.current = false;
              pendingAltEchoUntilRef.current = 0;
              setAltDigitsPreview('');
              resetPreetiBuffer();
            }}
            onClick={() => resetPreetiBuffer()}
            rows={expanded ? 15 : 9}
            style={{fontSize: `${fontSize}px`}}
            placeholder={
              mode === 'romanized'
                ? 'Type here: namaste nepal, kasto chha?'
                : isUnicodeSourceMode && unicodeInputHelper === 'romanized'
                  ? 'Romanized मा टाइप गर्नुहोस् (उदाहरण: mero desh nepal)...'
                  : isVisualPreetiActive
                    ? lang === 'ne'
                      ? 'Preeti किबोर्डबाट सिधै नेपालीमा टाइप गर्नुहोस् वा पाठ पेस्ट गर्नुहोस्...'
                      : 'Type using Preeti keyboard layout or paste Nepali text...'
                    : lang === 'ne'
                      ? 'MS Word वा Preeti फन्टबाट कपी गरिएको पाठ यहाँ पेस्ट गर्नुहोस्...'
                      : 'Paste text copied from Preeti or legacy Nepali font here...'
            }
            className={`font-nepali w-full flex-1 resize-y bg-transparent p-4 leading-[1.75] text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 ${
              expanded ? 'min-h-[380px]' : 'min-h-[240px]'
            }`}
          />

          {/* Left Pane Bottom Status Bar */}
          <div
            aria-live="polite"
            className="font-mono-tabular flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 bg-slate-50/80 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400"
          >
            <span>
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
              {lang === 'ne' ? 'खाली ठाउँ बिना' : 'no spaces'}
            </span>
          </div>
        </div>

        {/* Right Pane: Converted Output */}
        <div
          className={`flex flex-col transition-colors ${
            copied
              ? 'bg-emerald-50/40 dark:bg-emerald-950/25'
              : 'bg-white dark:bg-[#0F172A]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/75 bg-rose-50/35 px-4 py-2.5 dark:border-slate-800 dark:bg-[#131829]">
            <label
              htmlFor="converter-target-output"
              className="text-xs font-bold tracking-tight text-rose-800 dark:text-rose-300"
            >
              {targetLabel}
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              {isLegacyOutput && (
                <div
                  role="group"
                  aria-label="Output display format"
                  className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => setOutputVisualNepali(true)}
                    className={`min-h-[28px] rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                      outputVisualNepali
                        ? 'bg-white text-red-700 shadow-xs dark:bg-slate-900 dark:text-red-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'ne' ? 'नेपाली हेर्नुहोस्' : 'Preview Nepali'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputVisualNepali(false)}
                    className={`min-h-[28px] rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                      !outputVisualNepali
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'ne' ? 'फन्ट कोड' : 'Font Code'}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handlePrintClick}
                disabled={!displayedOutput}
                aria-label={lang === 'ne' ? 'नतिजा प्रिन्ट गर्नुहोस्' : 'Print output'}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/70 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/30"
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
                className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-3.5 py-1 text-xs font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
                  copied
                    ? 'bg-emerald-600 shadow-sm'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-sm'
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
                        : 'Copy Output'}
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
              className={`font-nepali w-full resize-y bg-transparent p-4 pb-12 leading-[1.75] text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 ${
                expanded ? 'min-h-[380px]' : 'min-h-[240px]'
              }`}
            />

            {activeOutput && copied && (
              <div className="pointer-events-none absolute right-3 bottom-3">
                <span className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                  {isLegacyOutput
                    ? lang === 'ne'
                      ? 'Preeti/फन्ट कोड कपी भयो'
                      : 'Font code copied'
                    : lang === 'ne'
                      ? 'क्लिपबोर्डमा कपी भयो'
                      : 'Copied to clipboard'}
                </span>
              </div>
            )}
          </div>

          {/* Legacy Font Counterpart Strip */}
          {isLegacyOutput && activeOutput && (
            <div className="border-t border-slate-200/75 bg-slate-50/70 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
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

          {/* Right Pane Bottom Status Bar */}
          <div className="font-mono-tabular flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 bg-slate-50/40 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
            <span>
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

      {/* Export + Text Utility Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={!activeOutput}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>.TXT</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDoc}
            disabled={!activeOutput}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Word (.DOC)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintClick}
            disabled={!displayedOutput}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{lang === 'ne' ? 'प्रिन्ट गर्नुहोस्' : 'Print'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyOutputTransform('to-ne-digits')}
            className="min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            0-9 → ०-९
          </button>
          <button
            type="button"
            onClick={() => applyOutputTransform('to-en-digits')}
            className="min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ०-९ → 0-9
          </button>
          <button
            type="button"
            onClick={() => applyOutputTransform('clean')}
            className="min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {lang === 'ne' ? 'खाली ठाउँ सफा' : 'Clean Spaces'}
          </button>
          <button
            type="button"
            onClick={() => applyOutputTransform('sort')}
            className="min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {lang === 'ne' ? 'क्रमबद्ध (अ–ज्ञ)' : 'Sort Lines'}
          </button>
          <button
            type="button"
            onClick={() => applyOutputTransform('dedupe')}
            className="min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {lang === 'ne' ? 'दोहोरिएको हटाउनुहोस्' : 'Dedupe Lines'}
          </button>
        </div>
      </div>

      {/* Quick Insert Special Nepali Symbols & Alt+Code Shortcuts */}
      <div className="mt-4 border-t border-slate-200/80 pt-3.5 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {lang === 'ne' ? 'छिटो थप्नुहोस्:' : 'Quick Insert:'}
            </span>
            {QUICK_SYMBOLS.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => handleInsertSymbol(sym)}
                className="font-nepali min-h-[32px] min-w-[32px] rounded-md border border-slate-200/90 border-b-2 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-800 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700 active:translate-y-[1px] active:border-b dark:border-slate-700 dark:border-b-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:border-red-500/60 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                {sym}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAltPalette((v) => !v)}
            className={`min-h-[32px] whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
              showAltPalette
                ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {lang === 'ne'
              ? showAltPalette
                ? 'Alt+Code लुकाउनुहोस्'
                : 'Alt+0xxx सर्टकट'
              : showAltPalette
                ? 'Hide Alt+Codes'
                : 'Alt+0xxx Shortcuts'}
          </button>
        </div>

        {showInspector && (
          <CodeInspectorDrawer
            text={displayedOutput || sourceUnicodeText || inputText}
            lang={lang}
          />
        )}

        {showAltPalette && (
          <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>
                {lang === 'ne'
                  ? 'किबोर्डमा Alt थिचेर नम्बर (जस्तै Alt+0170) टाइप गर्नुहोस्, वा यहाँ कोड खोजेर Enter/Click गर्नुहोस्:'
                  : 'Hold Alt + digits (e.g. Alt+0170) in the editor, or search & press Enter below:'}
              </span>
              <input
                type="search"
                value={altSearch}
                onChange={(e) => setAltSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredAltCodes[0]) {
                    e.preventDefault();
                    const first = filteredAltCodes[0];
                    handleInsertSymbol(
                      isLegacySourceMode && !preetiVisualTyping
                        ? first.asciiChar
                        : first.unicode,
                    );
                  }
                }}
                placeholder={lang === 'ne' ? 'कोड खोज्नुहोस् (0170, ङ)...' : 'Filter 0170, om, jha...'}
                className="font-mono-tabular h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-red-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="grid max-h-[260px] grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {filteredAltCodes.map((item) => (
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
                  className="flex min-h-[40px] items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-left transition-colors hover:border-red-300 hover:bg-red-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-red-500/50"
                >
                  <span className="font-nepali text-base font-bold text-red-700 dark:text-red-400">
                    {item.unicode}
                  </span>
                  <span className="font-mono-tabular text-[11px] font-medium text-slate-500 dark:text-slate-300">
                    {item.altLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <CommandPaletteModal
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        lang={lang}
        onSwitchMode={onModeChange}
        onRunAction={handlePaletteAction}
        onInsertAltCode={(unicode, asciiChar) =>
          handleInsertSymbol(
            isLegacySourceMode && !preetiVisualTyping ? asciiChar : unicode,
          )
        }
        onApplyTemplate={handleApplyTemplate}
      />
    </section>
  );
}
