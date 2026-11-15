// Phonetic Romanized Nepali -> Devanagari Unicode Engine
// Designed for natural Nepali typing (e.g., "mero desh nepal ho" -> "मेरो देश नेपाल हो")

const WORD_DICTIONARY: Record<string, string> = {
  nepal: 'नेपाल',
  nepali: 'नेपाली',
  namaste: 'नमस्ते',
  namaskar: 'नमस्कार',
  dhanyabad: 'धन्यवाद',
  dhanyabaad: 'धन्यवाद',
  tapai: 'तपाईं',
  tapaiko: 'तपाईंको',
  mero: 'मेरो',
  hamro: 'हाम्रो',
  timro: 'तिम्रो',
  kasto: 'कस्तो',
  chha: 'छ',
  xa: 'छ',
  chhan: 'छन्',
  xan: 'छन्',
  chhau: 'छौ',
  xau: 'छौ',
  chhaina: 'छैन',
  xaina: 'छैन',
  ho: 'हो',
  hoina: 'होइन',
  hunchha: 'हुन्छ',
  hunxa: 'हुन्छ',
  kathmandu: 'काठमाडौँ',
  pokhara: 'पोखरा',
  lalitpur: 'ललितपुर',
  bhaktapur: 'भक्तपुर',
  biratnagar: 'विराटनगर',
  prabidhi: 'प्रविधि',
  unicode: 'युनिकोड',
  preeti: 'प्रीति',
  subedi: 'सुवेदी',
  paban: 'पवन',
  sarkar: 'सरकार',
  samachar: 'समाचार',
  bidyalaya: 'विद्यालय',
  vidyalaya: 'विद्यालय',
  shree: 'श्री',
  shri: 'श्री',
  gyan: 'ज्ञान',
  bigyan: 'विज्ञान',
  vigyan: 'विज्ञान',
  desh: 'देश',
  rashtra: 'राष्ट्र',
  swagat: 'स्वागत',
  shubhakamana: 'शुभकामना',
  aaja: 'आज',
  bholi: 'भोलि',
  hijo: 'हिजो',
  samaya: 'समय',
  tarikh: 'तारिख',
  miti: 'मिति',
  baisakh: 'वैशाख',
  jestha: 'जेठ',
  ashadh: 'असार',
  shrawan: 'साउन',
  bhadra: 'भदौ',
  ashwin: 'असोज',
  kartik: 'कार्तिक',
  mangsir: 'मंसिर',
  poush: 'पुस',
  magh: 'माघ',
  falgun: 'फागुन',
  chaitra: 'चैत',
  garchhu: 'गर्छु',
  garxau: 'गर्छौ',
  gardai: 'गर्दै',
  bhayeko: 'भएको',
  bhaneko: 'भनेको',
  maile: 'मैले',
  hamile: 'हामीले',
  timile: 'तिमीले',
  malai: 'मलाई',
  timilai: 'तिमीलाई',
  tapailai: 'तपाईंलाई',
  chhu: 'छु',
  hun: 'हुन्',
  krishi: 'कृषि',
  kripa: 'कृपा',
  kripaya: 'कृपया',
  prithvi: 'पृथ्वी',
  hridaya: 'हृदय',
  smriti: 'स्मृति',
  srishti: 'सृष्टि',
  drishti: 'दृष्टि',
  amrit: 'अमृत',
  priya: 'प्रिया',
  kriya: 'क्रिया',
  sahitya: 'साहित्य',
  sangeet: 'संगीत',
  shiksha: 'शिक्षा',
  swasthya: 'स्वास्थ्य',
  byapar: 'व्यापार',
  rajniti: 'राजनीति',
  kanun: 'कानून',
  karyalaya: 'कार्यालय',
  mantralaya: 'मन्त्रालय',
  jilla: 'जिल्ला',
  nagarpalika: 'नगरपालिका',
  gaupalika: 'गाउँपालिका',
  birgunj: 'वीरगन्ज',
  dharan: 'धरान',
  butwal: 'बुटवल',
  chitwan: 'चितवन',
  janakpur: 'जनकपुर',
  hetauda: 'हेटौँडा',
  nepalgunj: 'नेपालगन्ज',
  barsa: 'वर्ष',
  mahina: 'महिना',
  din: 'दिन',
  sankhya: 'संख्या',
};

const VOWELS_STANDALONE: Array<[string, string]> = [
  ['aa', 'आ'],
  ['ai', 'ऐ'],
  ['au', 'औ'],
  ['ee', 'ई'],
  ['ii', 'ई'],
  ['oo', 'ऊ'],
  ['uu', 'ऊ'],
  ['rri', 'ऋ'],
  ['ri', 'ऋ'],
  ['a', 'अ'],
  ['A', 'आ'],
  ['i', 'इ'],
  ['I', 'ई'],
  ['u', 'उ'],
  ['U', 'ऊ'],
  ['e', 'ए'],
  ['E', 'ऐ'],
  ['o', 'ओ'],
  ['O', 'औ'],
];

const VOWEL_MATRAS: Array<[string, string]> = [
  ['aa', 'ा'],
  ['ai', 'ै'],
  ['au', 'ौ'],
  ['ee', 'ी'],
  ['ii', 'ी'],
  ['oo', 'ू'],
  ['uu', 'ू'],
  ['rri', 'ृ'],
  ['a', ''], // inherent schwa
  ['A', 'ा'],
  ['i', 'ि'],
  ['I', 'ी'],
  ['u', 'ु'],
  ['U', 'ू'],
  ['e', 'े'],
  ['E', 'ै'],
  ['o', 'ो'],
  ['O', 'ौ'],
];

const CONSONANTS: Array<[string, string]> = [
  ['chh', 'छ'],
  ['ksh', 'क्ष'],
  ['shr', 'श्र'],
  ['ng', 'ङ'],
  ['ch', 'च'],
  ['kh', 'ख'],
  ['gh', 'घ'],
  ['jh', 'झ'],
  ['Th', 'ठ'],
  ['Dh', 'ढ'],
  ['th', 'त'],
  ['dh', 'द'],
  ['ph', 'फ'],
  ['bh', 'भ'],
  ['sh', 'श'],
  ['Sh', 'ष'],
  ['tr', 'त्र'],
  ['gy', 'ज्ञ'],
  ['k', 'क'],
  ['g', 'ग'],
  ['c', 'च'],
  ['j', 'ज'],
  ['T', 'ट'],
  ['D', 'ड'],
  ['N', 'ण'],
  ['t', 'त'],
  ['d', 'द'],
  ['n', 'न'],
  ['p', 'प'],
  ['f', 'फ'],
  ['b', 'ब'],
  ['m', 'म'],
  ['y', 'य'],
  ['r', 'र'],
  ['l', 'ल'],
  ['v', 'व'],
  ['w', 'व'],
  ['s', 'स'],
  ['S', 'ष'],
  ['h', 'ह'],
  ['x', 'क्ष'],
  ['Y', 'ञ'],
  ['z', 'ज'],
  ['q', 'क'],
];

const DIGITS: Record<string, string> = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
};

function convertToken(token: string): string {
  if (!token) return '';
  const lower = token.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(WORD_DICTIONARY, lower)) {
    return WORD_DICTIONARY[lower];
  }

  let out = '';
  let i = 0;

  while (i < token.length) {
    const ch = token[i];

    // Special signs
    if (ch === '*') {
      out += 'ं';
      i += 1;
      continue;
    }
    if (ch === '^') {
      out += 'ँ';
      i += 1;
      continue;
    }
    if (ch === '.') {
      out += '।';
      i += 1;
      continue;
    }
    if (ch === ':') {
      out += 'ः';
      i += 1;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(DIGITS, ch)) {
      out += DIGITS[ch];
      i += 1;
      continue;
    }

    // Match consonant
    let matchedCons: [string, string] | null = null;
    for (const pair of CONSONANTS) {
      if (token.startsWith(pair[0], i)) {
        matchedCons = pair;
        break;
      }
    }

    if (matchedCons) {
      const [cKey, cVal] = matchedCons;
      i += cKey.length;

      // Explicit halant with backslash or slash
      if (token[i] === '\\' || token[i] === '/') {
        out += cVal + '्';
        i += 1;
        continue;
      }

      // Check following vowel matra
      let matchedMatra: [string, string] | null = null;
      for (const vPair of VOWEL_MATRAS) {
        if (token.startsWith(vPair[0], i)) {
          matchedMatra = vPair;
          break;
        }
      }

      if (matchedMatra) {
        out += cVal + matchedMatra[1];
        i += matchedMatra[0].length;
      } else {
        // Consonant followed by another consonant (not at end of word) -> add halant
        const nextIsCons = CONSONANTS.some(([k]) => token.startsWith(k, i));
        if (nextIsCons) {
          out += cVal + '्';
        } else {
          out += cVal;
        }
      }
      continue;
    }

    // Match standalone vowel
    let matchedVowel: [string, string] | null = null;
    for (const vPair of VOWELS_STANDALONE) {
      if (token.startsWith(vPair[0], i)) {
        matchedVowel = vPair;
        break;
      }
    }
    if (matchedVowel) {
      out += matchedVowel[1];
      i += matchedVowel[0].length;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

export function romanizedToUnicode(input: string): string {
  if (!input) return '';
  // Split preserving whitespace and punctuation
  const parts = input.split(/(\s+|[.,!?;:()"\-]+)/);
  return parts
    .map((part) => {
      if (!part) return part;
      if (/^\s+$/.test(part) || /^[,!?;()"\-]+$/.test(part)) {
        return part;
      }
      if (/^[.:]+$/.test(part)) {
        return part.replace(/\./g, '।');
      }
      return convertToken(part);
    })
    .join('');
}

export const ROMANIZED_EXAMPLES: Array<{roman: string; nepali: string}> = [
  {roman: 'mero desh nepal', nepali: 'मेरो देश नेपाल'},
  {roman: 'namaste tapai kasto hunuhunchha', nepali: 'नमस्ते तपाईं कस्तो हुनुहुन्छ'},
  {roman: 'prabidhi ra gyan', nepali: 'प्रविधि र ज्ञान'},
  {roman: 'aaja ko nepali miti', nepali: 'आज को नेपाली मिति'},
];
