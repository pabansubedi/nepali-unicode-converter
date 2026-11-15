// Nepali Number System (Thousand, Lakh, Crore, Arab, Kharab) to Nepali & English Words

const NEPALI_ONES = [
  'शून्य', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ',
  'दस', 'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस',
  'बीस', 'एक्काइस', 'बाइस', 'तेइस', 'चौबिस', 'पच्चिस', 'छब्बिस', 'सत्ताइस', 'अठ्ठाइस', 'उनन्तीस',
  'तीस', 'एकतीस', 'बत्तीस', 'तेत्तीस', 'चौँतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अठतीस', 'उनन्चालीस',
  'चालीस', 'एकचालीस', 'बयालीस', 'त्रिचालीस', 'चवालीस', 'पैंतालीस', 'छयालीस', 'सच्चालीस', 'अठचालीस', 'उनन्चास',
  'पचास', 'एकाउन्न', 'बाउन्न', 'त्रिपन्न', 'चउन्न', 'पचपन्न', 'छपन्न', 'सन्ताउन्न', 'अन्ठाउन्न', 'उनन्साठी',
  'साठी', 'एकसट्ठी', 'बयसट्ठी', 'त्रिसट्ठी', 'चौँसट्ठी', 'पैंसट्ठी', 'छयसट्ठी', 'सतसट्ठी', 'अठसट्ठी', 'उनन्सत्तरी',
  'सत्तरी', 'एकहत्तर', 'बहत्तर', 'त्रिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
  'असी', 'एकासी', 'बयासी', 'त्रियासी', 'चौरासी', 'पचासी', 'छयासी', 'सतासी', 'अठासी', 'उनान्नब्बे',
  'नब्बे', 'एकानब्बे', 'बयानब्बे', 'त्रियानब्बे', 'चौरानब्बे', 'पन्चानब्बे', 'छयानब्बे', 'सन्तानब्बे', 'अन्ठानब्बे', 'उनान्सय',
];

const EN_ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];

const EN_TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function twoDigitsEn(n: number): string {
  if (n < 20) return EN_ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${EN_TENS[t]} ${EN_ONES[o]}` : EN_TENS[t];
}

function threeDigitsNe(n: number): string {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(`${NEPALI_ONES[h]} सय`);
  if (rem > 0) parts.push(NEPALI_ONES[rem]);
  return parts.join(' ');
}

function threeDigitsEn(n: number): string {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(`${EN_ONES[h]} Hundred`);
  if (rem > 0) parts.push(twoDigitsEn(rem));
  return parts.join(' ');
}

export function formatNepaliCommaNumber(raw: string): string {
  const cleaned = raw.replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  if (cleaned.length <= 3) return cleaned;
  const lastThree = cleaned.slice(-3);
  const rest = cleaned.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${grouped},${lastThree}`;
}

export function numberToNepaliWords(raw: string): {
  ne: string;
  en: string;
  formatted: string;
} {
  const digits = raw.replace(/[०-९]/g, (d) =>
    String('०१२३४५६७८९'.indexOf(d)),
  ).replace(/[^0-9]/g, '');

  if (!digits) return {ne: '', en: '', formatted: ''};

  const num = Number(digits);
  if (!Number.isFinite(num) || num > 9999999999999) {
    return {
      ne: 'अंक धेरै ठूलो छ (१३ अंकसम्म मात्र)',
      en: 'Number too large (up to 13 digits)',
      formatted: formatNepaliCommaNumber(digits),
    };
  }

  if (num === 0) {
    return {ne: 'शून्य', en: 'Zero', formatted: '0'};
  }

  const kharab = Math.floor(num / 100000000000);
  const arab = Math.floor((num % 100000000000) / 1000000000);
  const crore = Math.floor((num % 1000000000) / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  const neParts: string[] = [];
  const enParts: string[] = [];

  if (kharab > 0) {
    neParts.push(`${NEPALI_ONES[kharab]} खर्ब`);
    enParts.push(`${twoDigitsEn(kharab)} Kharab`);
  }
  if (arab > 0) {
    neParts.push(`${NEPALI_ONES[arab]} अर्ब`);
    enParts.push(`${twoDigitsEn(arab)} Arab`);
  }
  if (crore > 0) {
    neParts.push(`${NEPALI_ONES[crore]} करोड`);
    enParts.push(`${twoDigitsEn(crore)} Crore`);
  }
  if (lakh > 0) {
    neParts.push(`${NEPALI_ONES[lakh]} लाख`);
    enParts.push(`${twoDigitsEn(lakh)} Lakh`);
  }
  if (thousand > 0) {
    neParts.push(`${NEPALI_ONES[thousand]} हजार`);
    enParts.push(`${twoDigitsEn(thousand)} Thousand`);
  }
  if (rest > 0) {
    neParts.push(threeDigitsNe(rest));
    enParts.push(threeDigitsEn(rest));
  }

  return {
    ne: neParts.join(' '),
    en: enParts.join(' '),
    formatted: formatNepaliCommaNumber(digits),
  };
}
