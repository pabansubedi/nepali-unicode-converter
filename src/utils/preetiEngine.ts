export type NepaliFontId =
  | 'unicode'
  | 'preeti'
  | 'kantipur'
  | 'sagarmatha'
  | 'himali'
  | 'pcs_nepali'
  | 'ganesh'
  | 'ritu';

export interface FontMeta {
  id: NepaliFontId;
  name: string;
  nepaliName: string;
  description: string;
}

export interface PreetiAltCodeMeta {
  code: string; // 4-digit string e.g. '0170'
  altLabel: string; // e.g. 'Alt+0170'
  asciiChar: string; // Windows-1252 character in Preeti font
  unicode: string; // Devanagari Unicode equivalent
  labelEn: string;
  labelNe: string;
}

export const PREETI_ALT_CODES: PreetiAltCodeMeta[] = [
  {code: '0170', altLabel: 'Alt+0170', asciiChar: 'ª', unicode: 'ङ', labelEn: 'Nga (ङ)', labelNe: 'ङ'},
  {code: '0171', altLabel: 'Alt+0171', asciiChar: '«', unicode: '\u094D\u0930', labelEn: 'Rakar (ट्र/ड्र)', labelNe: '्र (ट/ड मुनि)'},
  {code: '0180', altLabel: 'Alt+0180', asciiChar: '´', unicode: 'झ', labelEn: 'Jha (झ)', labelNe: 'झ'},
  {code: '0181', altLabel: 'Alt+0181', asciiChar: 'µ', unicode: 'ह्र', labelEn: 'Hra (ह्र)', labelNe: 'ह्र'},
  {code: '0182', altLabel: 'Alt+0182', asciiChar: '¶', unicode: 'हृ', labelEn: 'Hri (हृ)', labelNe: 'हृ'},
  {code: '0183', altLabel: 'Alt+0183', asciiChar: '·', unicode: 'ङ्ख', labelEn: 'Nkha (ङ्ख)', labelNe: 'ङ्ख'},
  {code: '0184', altLabel: 'Alt+0184', asciiChar: '¸', unicode: 'ह्म', labelEn: 'Hma (ह्म)', labelNe: 'ह्म'},
  {code: '0185', altLabel: 'Alt+0185', asciiChar: '¹', unicode: 'ह्य', labelEn: 'Hya (ह्य)', labelNe: 'ह्य'},
  {code: '0186', altLabel: 'Alt+0186', asciiChar: 'º', unicode: 'ह्व', labelEn: 'Hwa (ह्व)', labelNe: 'ह्व'},
  {code: '0187', altLabel: 'Alt+0187', asciiChar: '»', unicode: 'ह्न', labelEn: 'Hna (ह्न)', labelNe: 'ह्न'},
  {code: '0190', altLabel: 'Alt+0190', asciiChar: '¾', unicode: 'ह्ल', labelEn: 'Hla (ह्ल)', labelNe: 'ह्ल'},
  {code: '0191', altLabel: 'Alt+0191', asciiChar: '¿', unicode: 'रू', labelEn: 'Dirgha Ru (रू)', labelNe: 'रू (दीर्घ)'},
  {code: '0197', altLabel: 'Alt+0197', asciiChar: 'Å', unicode: 'हृ', labelEn: 'Hri (हृदय)', labelNe: 'हृ (हृदय)'},
  {code: '0205', altLabel: 'Alt+0205', asciiChar: 'Í', unicode: 'ङ्क', labelEn: 'Nka (ङ्क)', labelNe: 'ङ्क'},
  {code: '0206', altLabel: 'Alt+0206', asciiChar: 'Î', unicode: 'ङ्ख', labelEn: 'Nkha (ङ्ख)', labelNe: 'ङ्ख'},
  {code: '0207', altLabel: 'Alt+0207', asciiChar: 'Ï', unicode: 'ङ्ग', labelEn: 'Nga-Ga (ङ्ग)', labelNe: 'ङ्ग'},
  {code: '0208', altLabel: 'Alt+0208', asciiChar: 'Ð', unicode: 'ङ्घ', labelEn: 'Ngha (ङ्घ)', labelNe: 'ङ्घ'},
  {code: '0209', altLabel: 'Alt+0209', asciiChar: 'Ñ', unicode: 'ञ्च', labelEn: 'Ncha (ञ्च)', labelNe: 'ञ्च'},
  {code: '0210', altLabel: 'Alt+0210', asciiChar: 'Ò', unicode: 'ट्ट', labelEn: 'Tta-Tta (ट्ट)', labelNe: 'ट्ट'},
  {code: '0211', altLabel: 'Alt+0211', asciiChar: 'Ó', unicode: 'ठ्ठ', labelEn: 'Ttha-Ttha (ठ्ठ)', labelNe: 'ठ्ठ'},
  {code: '0212', altLabel: 'Alt+0212', asciiChar: 'Ô', unicode: 'ड्ड', labelEn: 'Dda-Dda (ड्ड)', labelNe: 'ड्ड'},
  {code: '0213', altLabel: 'Alt+0213', asciiChar: 'Õ', unicode: 'ढ्ढ', labelEn: 'Ddha-Ddha (ढ्ढ)', labelNe: 'ढ्ढ'},
  {code: '0214', altLabel: 'Alt+0214', asciiChar: 'Ö', unicode: 'द्म', labelEn: 'Dma (द्म)', labelNe: 'द्म'},
  {code: '0215', altLabel: 'Alt+0215', asciiChar: '×', unicode: 'द्व', labelEn: 'Dwa (द्व)', labelNe: 'द्व'},
  {code: '0216', altLabel: 'Alt+0216', asciiChar: 'Ø', unicode: 'ह्म', labelEn: 'Hma (ह्म)', labelNe: 'ह्म'},
  {code: '0217', altLabel: 'Alt+0217', asciiChar: 'Ù', unicode: 'ह्य', labelEn: 'Hya (ह्य)', labelNe: 'ह्य'},
  {code: '0218', altLabel: 'Alt+0218', asciiChar: 'Ú', unicode: 'ऊ', labelEn: 'Dirgha U (ऊ)', labelNe: 'ऊ'},
  {code: '0221', altLabel: 'Alt+0221', asciiChar: 'Ý', unicode: 'ॐ', labelEn: 'Om (ॐ)', labelNe: 'ॐ'},
  {code: '0222', altLabel: 'Alt+0222', asciiChar: 'Þ', unicode: 'द्घ', labelEn: 'Dgha (द्घ)', labelNe: 'द्घ'},
  {code: '0223', altLabel: 'Alt+0223', asciiChar: 'ß', unicode: 'त्त', labelEn: 'Tta (त्त)', labelNe: 'त्त'},
  {code: '0161', altLabel: 'Alt+0161', asciiChar: '¡', unicode: 'ज्ञ्', labelEn: 'Half Gya (ज्ञ्)', labelNe: 'ज्ञ्'},
  {code: '0163', altLabel: 'Alt+0163', asciiChar: '£', unicode: 'घ्', labelEn: 'Half Gha (घ्)', labelNe: 'घ्'},
  {code: '0164', altLabel: 'Alt+0164', asciiChar: '¤', unicode: 'द्ध', labelEn: 'Ddha (द्ध)', labelNe: 'द्ध'},
  {code: '0165', altLabel: 'Alt+0165', asciiChar: '¥', unicode: 'छ्', labelEn: 'Half Chha (छ्)', labelNe: 'छ्'},
  {code: '0167', altLabel: 'Alt+0167', asciiChar: '§', unicode: 'ट्ट', labelEn: 'Tta-Tta (ट्ट)', labelNe: 'ट्ट'},
  {code: '0172', altLabel: 'Alt+0172', asciiChar: '¬', unicode: 'ङ्क', labelEn: 'Nka (ङ्क)', labelNe: 'ङ्क'},
  {code: '0176', altLabel: 'Alt+0176', asciiChar: '°', unicode: 'ङ्ग', labelEn: 'Nga-Ga (ङ्ग)', labelNe: 'ङ्ग'},
  {code: '0177', altLabel: 'Alt+0177', asciiChar: '±', unicode: '+', labelEn: 'Plus (+)', labelNe: '+ (जोड)'},
  {code: '0178', altLabel: 'Alt+0178', asciiChar: '²', unicode: 'द्द', labelEn: 'Dda (द्द)', labelNe: 'द्द'},
  {code: '0179', altLabel: 'Alt+0179', asciiChar: '³', unicode: 'द्य', labelEn: 'Dya (द्य)', labelNe: 'द्य'},
  {code: '0188', altLabel: 'Alt+0188', asciiChar: '¼', unicode: '(', labelEn: 'Left Paren (', labelNe: '( कोष्ठक'},
  {code: '0189', altLabel: 'Alt+0189', asciiChar: '½', unicode: ')', labelEn: 'Right Paren )', labelNe: ') कोष्ठक'},
  {code: '0247', altLabel: 'Alt+0247', asciiChar: '÷', unicode: '/', labelEn: 'Slash (/)', labelNe: '/ (स्ल्यास)'},
];

export function resolvePreetiAltCode(digits: string): PreetiAltCodeMeta | null {
  const cleaned = digits.trim();
  if (!cleaned) return null;
  const padded = cleaned.length === 3 ? `0${cleaned}` : cleaned;
  return (
    PREETI_ALT_CODES.find(
      (item) => item.code === padded || String(Number(item.code)) === cleaned,
    ) ?? null
  );
}

export const NEPALI_FONTS: FontMeta[] = [
  {
    id: 'unicode',
    name: 'Unicode (Devanagari)',
    nepaliName: 'युनिकोड (देवनागरी)',
    description: 'Universal web & mobile standard UTF-8 Devanagari text',
  },
  {
    id: 'preeti',
    name: 'Preeti',
    nepaliName: 'प्रीति (Preeti)',
    description: 'Most widely used Nepali TrueType DTP & office font',
  },
  {
    id: 'kantipur',
    name: 'Kantipur',
    nepaliName: 'कान्तिपुर (Kantipur)',
    description: 'Classic newspaper & publishing font (Preeti-layout compatible)',
  },
  {
    id: 'sagarmatha',
    name: 'Sagarmatha',
    nepaliName: 'सगरमाथा (Sagarmatha)',
    description: 'Traditional Nepali print & book layout font',
  },
  {
    id: 'himali',
    name: 'Fontasy Himali',
    nepaliName: 'हिमाली (Fontasy Himali)',
    description: 'Legacy Himalayan typesetting & press font',
  },
  {
    id: 'pcs_nepali',
    name: 'PCS Nepali',
    nepaliName: 'पिसिएस नेपाली (PCS Nepali)',
    description: 'Nepal government & judicial office standard legacy font',
  },
  {
    id: 'ganesh',
    name: 'Ganesh',
    nepaliName: 'गणेश (Ganesh)',
    description: 'Legacy Nepali invitation & administrative font',
  },
  {
    id: 'ritu',
    name: 'Ritu',
    nepaliName: 'ऋतु (Ritu)',
    description: 'Classic Nepali DTP & editorial print font',
  },
];

const SENTINEL_HRASWO_I = '\uE001';
const SENTINEL_REPH = '\uE002';

// Multi-character Preeti tokens ordered longest-first
const PREETI_MULTI_TO_UNICODE: Array<[string, string]> = [
  ['cf]', 'ओ'],
  ['cf}', 'औ'],
  ['O{', 'ई'],
  ['P]', 'ऐ'],
  ['pm', 'ऊ'],
  ['cf', 'आ'],
  ['c+', 'अं'],
  ['cM', 'अः'],
  ['f]', 'ो'],
  ['f}', 'ौ'],
  ['em', 'झ'],
  ['km', 'फ'],
  ['If', 'क्ष'],
  ['vf', 'ख'],
  ['wf', 'ध'],
  ['ef', 'भ'],
  ['if', 'ष'],
  ['yf', 'थ'],
  ['0f', 'ण'],
  ['`f', 'ञ'],
  ['~f', 'ञ'],
  ['/\'', 'रु'],
  ['/"', 'रू'],
  ['Å', 'हृ'],
  // Preeti 'L' (ी) carries its own vertical bar, so half-stem consonants + L form full Consonant+ी
  ['vL', 'खी'],
  ['wL', 'धी'],
  ['eL', 'भी'],
  ['yL', 'थी'],
  ['iL', 'षी'],
  ['0L', 'णी'],
  ['`L', 'ञी'],
  ['~L', 'ञी'],
  ['IL', 'क्षी'],
];

const PREETI_SINGLE_TO_UNICODE: Record<string, string> = {
  // Vowels & modifiers
  c: 'अ',
  O: 'इ',
  p: 'उ',
  C: 'ऋ',
  P: 'ए',
  f: 'ा',
  l: SENTINEL_HRASWO_I,
  L: 'ी',
  "'": 'ु',
  '"': 'ू',
  '[': 'ृ',
  ']': 'े',
  '}': 'ै',
  '{': SENTINEL_REPH,
  '+': 'ं',
  F: 'ँ',
  M: 'ः',
  '\\': '्',
  '|': '\u094D\u0930',
  '«': '\u094D\u0930',

  // Consonants & half-forms
  s: 'क',
  S: 'क्',
  v: 'ख्',
  V: 'ख्',
  u: 'ग',
  U: 'ग्',
  '3': 'घ',
  'ª': 'ङ',
  r: 'च',
  R: 'च्',
  '5': 'छ',
  h: 'ज',
  H: 'ज्',
  '`': 'ञ्',
  '~': 'ञ्',
  '6': 'ट',
  '7': 'ठ',
  '8': 'ड',
  '9': 'ढ',
  '0': 'ण्',
  t: 'त',
  T: 'त्',
  y: 'थ्',
  Y: 'थ्',
  b: 'द',
  w: 'ध्',
  W: 'ध्',
  g: 'न',
  G: 'न्',
  k: 'प',
  K: 'प्',
  a: 'ब',
  A: 'ब्',
  e: 'भ्',
  E: 'भ्',
  d: 'म',
  D: 'म्',
  o: 'य',
  '/': 'र',
  n: 'ल',
  N: 'ल्',
  j: 'व',
  J: 'व्',
  z: 'श',
  Z: 'श्',
  i: 'ष्',
  I: 'क्ष्',
  ';': 'स',
  ':': 'स्',
  x: 'ह',
  X: 'ह्',

  // Special conjuncts & ligatures
  q: 'त्र',
  Q: 'त्त',
  '1': 'ज्ञ',
  '2': 'द्द',
  '4': 'द्ध',
  '>': 'श्र',
  B: 'द्य',
  '?': 'रु',

  // Digits (Shift + 1..0)
  '!': '१',
  '@': '२',
  '#': '३',
  '$': '४',
  '%': '५',
  '^': '६',
  '&': '७',
  '*': '८',
  '(': '९',
  ')': '०',

  // Punctuation
  '.': '।',
  '<': '?',
  '=': '.',
  '-': '(',
  _: ')',

  // Extended Windows-1252 Preeti Alt+0xxx characters
  '¡': 'ज्ञ्',
  '¢': 'द्ध',
  '£': 'घ्',
  '¤': 'द्ध',
  '¥': 'छ्',
  '¦': 'ट्ठ',
  '§': 'ट्ट',
  '¨': 'ड्ड',
  '©': 'ढ्ढ',
  '¬': 'ङ्क',
  '®': 'र्',
  '°': 'ङ्ग',
  '±': '+',
  '²': 'द्द',
  '³': 'द्य',
  '´': 'झ',
  'µ': 'ह्र',
  '¶': 'हृ',
  '·': 'ङ्ख',
  '¸': 'ह्म',
  '¹': 'ह्य',
  'º': 'ह्व',
  '»': 'ह्न',
  '¼': '(',
  '½': ')',
  '¾': 'ह्ल',
  '¿': 'रू',
  'Á': 'क्ष्',
  'Â': 'हृ',
  'Ã': 'त्र्',
  'Ä': 'ङ्ख',
  'Æ': 'द्घ',
  'Ç': 'ठ्ठ',
  'È': 'ड्ड',
  'É': 'ढ्ढ',
  'Ê': 'द्म',
  'Ë': 'द्व',
  'Ì': 'ॐ',
  'Í': 'ङ्क',
  'Î': 'ङ्ख',
  'Ï': 'ङ्ग',
  'Ð': 'ङ्घ',
  'Ñ': 'ञ्च',
  'Ò': 'ट्ट',
  'Ó': 'ठ्ठ',
  'Ô': 'ड्ड',
  'Õ': 'ढ्ढ',
  'Ö': 'द्म',
  '×': 'द्व',
  'Ø': 'ह्म',
  'Ù': 'ह्य',
  'Ú': 'ऊ',
  'Û': 'ह्व',
  'Ü': 'ह्ल',
  'Ý': 'ॐ',
  'Þ': 'द्घ',
  'ß': 'त्त',
  'â': 'द्य',
  'ä': 'ड्ड',
  'æ': 'द्म',
  'ç': 'हृ',
  '÷': '/',
  'ú': 'ऊ',
  'ü': 'ॐ',
};

// Font-specific pre-normalization adapters before running Preeti engine
const LEGACY_FONT_PATCHES: Record<Exclude<NepaliFontId, 'unicode' | 'preeti'>, Record<string, string>> = {
  kantipur: {
    '~': '`',
    'Ö': '?',
    'Ú': 'pm',
  },
  sagarmatha: {
    'Ú': 'pm',
    '¦': '?',
  },
  himali: {
    'Ú': 'pm',
    'ª': 'ª',
    '±': '+',
  },
  pcs_nepali: {
    '¿': '/"',
    'Ú': 'pm',
  },
  ganesh: {
    'Ú': 'pm',
  },
  ritu: {
    'Ú': 'pm',
  },
};

const LEGACY_FONT_REVERSE_PATCHES: Record<Exclude<NepaliFontId, 'unicode' | 'preeti'>, Record<string, string>> = {
  kantipur: {},
  sagarmatha: {},
  himali: {},
  pcs_nepali: {},
  ganesh: {},
  ritu: {},
};

function normalizeSmartQuotes(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

function applyLegacyPatch(
  input: string,
  patch: Record<string, string>,
): string {
  let out = input;
  for (const [k, v] of Object.entries(patch)) {
    if (k !== v) {
      out = out.split(k).join(v);
    }
  }
  return out;
}

function convertPreetiSegmentToUnicode(
  rawSegment: string,
  sourceFont: NepaliFontId,
): string {
  let text = normalizeSmartQuotes(rawSegment);

  if (sourceFont !== 'preeti' && sourceFont in LEGACY_FONT_PATCHES) {
    text = applyLegacyPatch(
      text,
      LEGACY_FONT_PATCHES[sourceFont as Exclude<NepaliFontId, 'unicode' | 'preeti'>],
    );
  }

  let result = '';
  let i = 0;

  while (i < text.length) {
    let matched = false;
    for (const [token, mapped] of PREETI_MULTI_TO_UNICODE) {
      if (text.startsWith(token, i)) {
        result += mapped;
        i += token.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = text[i];
    if (Object.prototype.hasOwnProperty.call(PREETI_SINGLE_TO_UNICODE, ch)) {
      result += PREETI_SINGLE_TO_UNICODE[ch];
    } else {
      result += ch;
    }
    i += 1;
  }

  result = result
    .replace(/\u094D\u093E/g, '')
    .replace(/\u094D\u094D\u0930/g, '\u094D\u0930')
    .replace(/अा/g, 'आ')
    .replace(/आे/g, 'ओ')
    .replace(/आै/g, 'औ')
    .replace(/एे/g, 'ऐ')
    .replace(/ाे/g, 'ो')
    .replace(/ाै/g, 'ौ');

  const clusterPattern =
    '(?:[\\u0915-\\u0939\\u0958-\\u095F]\\u094D)*[\\u0915-\\u0939\\u0958-\\u095F]';
  const iKaarRegex = new RegExp(`${SENTINEL_HRASWO_I}(${clusterPattern})`, 'g');
  result = result.replace(iKaarRegex, '$1\u093F');
  result = result.replace(new RegExp(SENTINEL_HRASWO_I, 'g'), '\u093F');

  const rephRegex = new RegExp(
    `(${clusterPattern})(\\u094D|[\\u093E-\\u094C\\u0901-\\u0903]*)${SENTINEL_REPH}`,
    'g',
  );
  let prev = '';
  while (prev !== result) {
    prev = result;
    result = result.replace(rephRegex, '\u0930\u094D$1$2');
  }
  result = result.replace(new RegExp(SENTINEL_REPH, 'g'), '\u0930\u094D');

  return result;
}

export function preetiToUnicode(rawInput: string, sourceFont: NepaliFontId = 'preeti'): string {
  if (!rawInput) return '';
  if (sourceFont === 'unicode') return rawInput;

  // Preserve lines that already contain Devanagari Unicode without Preeti ASCII letters
  // so pasted Unicode text & punctuation (:, /, !, [, ]) are never mangled
  const lines = rawInput.split('\n');
  return lines
    .map((line) => {
      const hasDevanagari = /[\u0900-\u097F]/.test(line);
      const hasAsciiLetters = /[a-zA-Z]/.test(line);
      if (hasDevanagari && !hasAsciiLetters) {
        return line;
      }
      return convertPreetiSegmentToUnicode(line, sourceFont);
    })
    .join('\n');
}

const UNICODE_CONJUNCTS_TO_PREETI: Array<[string, string]> = [
  ['क्ष', 'If'],
  ['त्र', 'q'],
  ['ज्ञ', '1'],
  ['श्र', '>'],
  ['द्य', 'B'],
  ['द्द', '2'],
  ['द्ध', '4'],
  ['त्त', 'Q'],
  ['रु', '?'],
  ['रू', '/"'],
  ['हृ', 'Å'],
  ['ह्म', 'Ø'],
  ['ह्य', 'Ù'],
  ['ह्व', 'º'],
  ['ह्न', '»'],
  ['ह्ल', '¾'],
  ['ह्र', 'µ'],
  ['द्व', '×'],
  ['द्म', 'Ö'],
  ['द्घ', 'Þ'],
  ['ट्ट', 'Ò'],
  ['ठ्ठ', 'Ó'],
  ['ड्ड', 'Ô'],
  ['ढ्ढ', 'Õ'],
  ['ङ्क', 'Í'],
  ['ङ्ख', 'Î'],
  ['ङ्ग', 'Ï'],
  ['ङ्घ', 'Ð'],
  ['ञ्च', 'Ñ'],
];

const UNICODE_CONSONANT_HALF_TO_PREETI: Record<string, string> = {
  क: 'S',
  ख: 'v',
  ग: 'U',
  घ: '£',
  ङ: 'ª\\',
  च: 'R',
  छ: '¥',
  ज: 'H',
  झ: 'em\\',
  ञ: '`',
  ट: '6\\',
  ठ: '7\\',
  ड: '8\\',
  ढ: '9\\',
  ण: '0',
  त: 'T',
  थ: 'y',
  द: 'b\\',
  ध: 'w',
  न: 'G',
  प: 'K',
  फ: 'km\\',
  ब: 'A',
  भ: 'e',
  म: 'D',
  य: 'o\\',
  र: '/',
  ल: 'N',
  व: 'J',
  श: 'Z',
  ष: 'i',
  स: ':',
  ह: 'X',
};

const UNICODE_SINGLE_TO_PREETI: Record<string, string> = {
  अ: 'c',
  आ: 'cf',
  इ: 'O',
  ई: 'O{',
  उ: 'p',
  ऊ: 'pm',
  ऋ: 'C',
  ए: 'P',
  ऐ: 'P]',
  ओ: 'cf]',
  औ: 'cf}',

  क: 's',
  ख: 'vf',
  ग: 'u',
  घ: '3',
  ङ: 'ª',
  च: 'r',
  छ: '5',
  ज: 'h',
  झ: 'em',
  ञ: '`f',
  ट: '6',
  ठ: '7',
  ड: '8',
  ढ: '9',
  ण: '0f',
  त: 't',
  थ: 'yf',
  द: 'b',
  ध: 'wf',
  न: 'g',
  प: 'k',
  फ: 'km',
  ब: 'a',
  भ: 'ef',
  म: 'd',
  य: 'o',
  र: '/',
  ल: 'n',
  व: 'j',
  श: 'z',
  ष: 'if',
  स: ';',
  ह: 'x',

  // Matras & signs
  '\u093E': 'f',
  '\u093F': 'l',
  '\u0940': 'L',
  '\u0941': "'",
  '\u0942': '"',
  '\u0943': '[',
  '\u0947': ']',
  '\u0948': '}',
  '\u094B': 'f]',
  '\u094C': 'f}',
  '\u0902': '+',
  '\u0901': 'F',
  '\u0903': 'M',
  '\u094D': '\\',

  // Digits
  '०': ')',
  '१': '!',
  '२': '@',
  '३': '#',
  '४': '$',
  '५': '%',
  '६': '^',
  '७': '&',
  '८': '*',
  '९': '(',

  // Punctuation
  '।': '.',
  '॥': '..',
  '?': '<',
  '.': '=',
  '(': '-',
  ')': '_',
  '/': '÷',
  '+': '±',
  'ॐ': 'Ý',
};

const DEV_CONSONANTS = new Set([
  'क', 'ख', 'ग', 'घ', 'ङ',
  'च', 'छ', 'ज', 'झ', 'ञ',
  'ट', 'ठ', 'ड', 'ढ', 'ण',
  'त', 'थ', 'द', 'ध', 'न',
  'प', 'फ', 'ब', 'भ', 'म',
  'य', 'र', 'ल', 'व',
  'श', 'ष', 'स', 'ह',
]);

const DEV_MATRAS = new Set([
  '\u093E', '\u093F', '\u0940', '\u0941', '\u0942', '\u0943',
  '\u0947', '\u0948', '\u094B', '\u094C',
  '\u0901', '\u0902', '\u0903',
]);

export function unicodeToPreeti(rawInput: string, targetFont: NepaliFontId = 'preeti'): string {
  if (!rawInput) return '';
  if (targetFont === 'unicode') return rawInput;

  let text = rawInput.normalize('NFC');

  text = text.replace(
    /((?:[\u0915-\u0939]\u094D)*[\u0915-\u0939])\u093F/g,
    (_match, cluster, offset, str) => {
      if (
        cluster.startsWith('र\u094D') &&
        cluster.length > 2 &&
        (offset === 0 || str[offset - 1] !== '\u094D')
      ) {
        return 'र\u094D\uE003' + cluster.slice(2);
      }
      return '\uE003' + cluster;
    },
  );

  let out = '';
  let i = 0;
  while (i < text.length) {
    if (
      text[i] === 'र' &&
      text[i + 1] === '\u094D' &&
      i + 2 < text.length &&
      (DEV_CONSONANTS.has(text[i + 2]) || text[i + 2] === '\uE003') &&
      (i === 0 || text[i - 1] !== '\u094D')
    ) {
      i += 2;
      if (text[i] === '\uE003') {
        out += '\uE003';
        i += 1;
      }
      while (i < text.length && DEV_CONSONANTS.has(text[i])) {
        out += text[i];
        i += 1;
        if (text[i] === '\u094D' && i + 1 < text.length && DEV_CONSONANTS.has(text[i + 1])) {
          out += text[i];
          i += 1;
        } else {
          break;
        }
      }
      while (i < text.length && DEV_MATRAS.has(text[i])) {
        out += text[i];
        i += 1;
      }
      out += '\uE004';
      continue;
    }

    out += text[i];
    i += 1;
  }

  let preeti = '';
  i = 0;
  while (i < out.length) {
    const ch = out[i];

    if (ch === '\uE003') {
      preeti += 'l';
      i += 1;
      continue;
    }
    if (ch === '\uE004') {
      preeti += '{';
      i += 1;
      continue;
    }

    let matchedConjunct = false;
    for (const [conj, pVal] of UNICODE_CONJUNCTS_TO_PREETI) {
      if (out.startsWith(conj, i)) {
        if (out[i + conj.length] === '\u094D' && conj === 'क्ष') {
          preeti += 'I';
          i += conj.length + 1;
        } else {
          preeti += pVal;
          i += conj.length;
        }
        matchedConjunct = true;
        break;
      }
    }
    if (matchedConjunct) continue;

    if (
      ch === '\u094D' &&
      out[i + 1] === 'र' &&
      i > 0 &&
      DEV_CONSONANTS.has(out[i - 1])
    ) {
      const prevCons = out[i - 1];
      if (['ट', 'ठ', 'ड', 'ढ'].includes(prevCons)) {
        preeti += '«';
      } else {
        preeti += '|';
      }
      i += 2;
      continue;
    }

    if (DEV_CONSONANTS.has(ch) && out[i + 1] === '\u094D') {
      if (out[i + 2] === 'र') {
        if (['ख', 'ण', 'थ', 'ध', 'भ', 'ष'].includes(ch)) {
          preeti += UNICODE_CONSONANT_HALF_TO_PREETI[ch] || UNICODE_SINGLE_TO_PREETI[ch];
        } else {
          preeti += UNICODE_SINGLE_TO_PREETI[ch] ?? ch;
        }
        i += 1;
        continue;
      }

      const half = UNICODE_CONSONANT_HALF_TO_PREETI[ch];
      if (half) {
        preeti += half;
        i += 2;
        continue;
      }
    }

    if (Object.prototype.hasOwnProperty.call(UNICODE_SINGLE_TO_PREETI, ch)) {
      preeti += UNICODE_SINGLE_TO_PREETI[ch];
    } else {
      preeti += ch;
    }
    i += 1;
  }

  if (targetFont !== 'preeti' && targetFont in LEGACY_FONT_REVERSE_PATCHES) {
    preeti = applyLegacyPatch(
      preeti,
      LEGACY_FONT_REVERSE_PATCHES[targetFont as Exclude<NepaliFontId, 'unicode' | 'preeti'>],
    );
  }

  return preeti;
}

export function convertBetweenFonts(
  text: string,
  fromFont: NepaliFontId,
  toFont: NepaliFontId,
): string {
  if (!text) return '';
  if (fromFont === toFont) return text;

  const unicodeText =
    fromFont === 'unicode' ? text : preetiToUnicode(text, fromFont);

  if (toFont === 'unicode') return unicodeText;
  return unicodeToPreeti(unicodeText, toFont);
}

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toNepaliDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => NEPALI_DIGITS[Number(d)]);
}

export function toEnglishDigits(input: string): string {
  return input.replace(/[०-९]/g, (d) => String(NEPALI_DIGITS.indexOf(d)));
}

export function cleanNepaliText(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +\n/g, '\n')
    .replace(/\n +/g, '\n')
    .trim();
}

export function sortNepaliLines(input: string): string {
  const lines = input
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length <= 1) return input;
  return lines.sort((a, b) => a.localeCompare(b, 'ne')).join('\n');
}

export function dedupeNepaliLines(input: string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const rawLine of input.split(/\r\n|\r|\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(rawLine);
    }
  }
  return out.join('\n');
}

export interface TextMetrics {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  sentences: number;
}

export function computeTextMetrics(text: string): TextMetrics {
  if (!text) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      sentences: 0,
    };
  }
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const lines = text.split(/\r\n|\r|\n/).length;
  const sentences = trimmed
    ? trimmed.split(/[।.!?]+/).filter((s) => s.trim().length > 0).length
    : 0;
  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words,
    lines,
    sentences,
  };
}
