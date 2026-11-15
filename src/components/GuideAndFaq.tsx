import {useMemo, useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {NEPALI_FONTS, PREETI_ALT_CODES} from '../utils/preetiEngine';

interface GuideAndFaqProps {
  lang: 'en' | 'ne';
  showPrivacyModal: boolean;
  onClosePrivacyModal: () => void;
}

const PREETI_KEY_GUIDE = [
  {key: 's', char: 'क', example: 'sdn → कमल'},
  {key: 'v', char: 'ख', example: 'vfgf → खाना'},
  {key: 'u', char: 'ग', example: 'ufpF → गाउँ'},
  {key: '3', char: 'घ', example: '3/ → घर'},
  {key: 'ª (Alt+0170)', char: 'ङ', example: 'अङ्ग'},
  {key: 'r', char: 'च', example: 'rf/ → चार'},
  {key: '5', char: 'छ', example: '5f]6f] → छोटो'},
  {key: 'h', char: 'ज', example: 'hn → जल'},
  {key: 'em (Alt+0180)', char: 'झ', example: 'em08f → झण्डा'},
  {key: '6 / 7 / 8 / 9', char: 'ट / ठ / ड / ढ', example: '6f]kL → टोपी'},
  {key: '0f', char: 'ण', example: 'u0f]z → गणेश'},
  {key: 't / y / b / w / g', char: 'त / थ / द / ध / न', example: 'tn → तल, bn → दल'},
  {key: 'k / km / a / e / d', char: 'प / फ / ब / भ / म', example: 'kmn → फल'},
  {key: 'o / / / n / j', char: 'य / र / ल / व', example: 'ljBf → विद्या'},
  {key: 'z / if / ; / x', char: 'श / ष / स / ह', example: 'b]z → देश'},
  {key: 'If / q / 1 / >', char: 'क्ष / त्र / ज्ञ / श्र', example: '>L → श्री'},
  {key: 'l / L / \' / " / ] / }', char: 'ि / ी / ु / ू / े / ै', example: 'd]/f] → मेरो'},
  {key: '{ / |', char: 'र् (रेफ) / ्र (पदेन)', example: 'sd{ → कर्म, k| → प्र'},
  {key: '! @ # $ % ^ & * ( )', char: '१ २ ३ ४ ५ ६ ७ ८ ९ ०', example: 'Shift + 1..0'},
];

const ROMANIZED_KEY_GUIDE = [
  {key: 'ka / kha / ga / gha / nga', char: 'क / ख / ग / घ / ङ', example: 'kamal → कमल'},
  {key: 'cha / chha / ja / jha', char: 'च / छ / ज / झ', example: 'chha → छ'},
  {key: 'Ta / Tha / Da / Dha / Na', char: 'ट / ठ / ड / ढ / ण', example: 'Topi → टोपी'},
  {key: 'ta / tha / da / dha / na', char: 'त / थ / द / ध / न', example: 'nepal → नेपाल'},
  {key: 'pa / pha / ba / bha / ma', char: 'प / फ / ब / भ / म', example: 'prabidhi → प्रविधि'},
  {key: 'ksh / tr / gy / shr', char: 'क्ष / त्र / ज्ञ / श्र', example: 'gyan → ज्ञान'},
  {key: 'aa / ee / oo / ai / au', char: 'आ / ई / ऊ / ऐ / औ', example: 'aaja → आज'},
  {key: '* / ^ / \\', char: 'ं / ँ / ् (हलन्त)', example: 'k\\ → क्'},
];

const ALT_CODE_KEY_GUIDE = PREETI_ALT_CODES.map((item) => ({
  key: item.altLabel,
  char: item.unicode,
  example: `${item.labelNe} · Code: ${item.asciiChar}`,
}));

const FAQS = [
  {
    qEn: 'How accurate is Preeti to Unicode and Unicode to Preeti conversion?',
    qNe: 'प्रीति र युनिकोड रूपान्तरण कतिको सटीक छ?',
    aEn: 'The converter handles standard Preeti matra reordering including hraswo i-kaar (l), reph ({), rakar (|), half-consonants, MS Word smart curly quotes, and special ligatures like क्ष, त्र, ज्ञ, श्र, द्य, द्द, and द्ध.',
    aNe: 'यसमा ह्रस्व इकार (l), रेफ ({), रकार (|), आधा अक्षर, MS Word का कर्ली कोट्स तथा क्ष, त्र, ज्ञ, श्र, द्य, द्द, द्ध जस्ता संयुक्ताक्षरहरू सटीक रूपमा रूपान्तरण हुन्छन्।',
  },
  {
    qEn: 'Is my typed text saved or shared anywhere?',
    qNe: 'के मेरो टाइप गरिएको पाठ कतै सेभ वा सेयर हुन्छ?',
    aEn: 'No. Every font conversion, Romanized typing session, and Bikram Sambat date lookup runs privately inside your browser. Recent snippets stay only on your device and can be cleared anytime.',
    aNe: 'हुँदैन। सबै फन्ट रूपान्तरण र मिति गणना तपाईंको ब्राउजरमै सुरक्षित रूपमा चल्छ। कुनै पनि पाठ बाहिर पठाइँदैन।',
  },
  {
    qEn: 'Can I download my converted Nepali text for Microsoft Word?',
    qNe: 'के रूपान्तरण भएको नेपाली पाठ MS Word को लागि डाउनलोड गर्न मिल्छ?',
    aEn: 'Yes. Use the Word (.DOC) or .TXT download buttons right below the output editor to save your converted Nepali text with proper UTF-8 Devanagari formatting.',
    aNe: 'मिल्छ। नतिजा बाकसको तल रहेको Word (.DOC) वा .TXT बटन थिचेर सिधै फाइल डाउनलोड गर्न सक्नुहुन्छ।',
  },
  {
    qEn: 'Why do Preeti, Kantipur, or PCS Nepali outputs look like English characters?',
    qNe: 'Preeti वा Kantipur मा रूपान्तरण गर्दा अंग्रेजी अक्षर किन देखिन्छ?',
    aEn: 'Legacy Nepali TrueType fonts map Devanagari letters onto standard English keyboard keys. Copy the converted font text and paste it into MS Word, Photoshop, or InDesign with the matching Nepali font selected.',
    aNe: 'Preeti, Kantipur वा PCS Nepali जस्ता पुरानो फन्टले अंग्रेजी किबोर्डका कुञ्जी प्रयोग गरी नेपाली अक्षर बनाउँछन्। यहाँबाट कपी गरिएको नतिजा MS Word वा Photoshop मा राखेर Preeti फन्ट छान्दा सही नेपाली अक्षर देखिन्छ।',
  },
];

export function GuideAndFaq({
  lang,
  showPrivacyModal,
  onClosePrivacyModal,
}: GuideAndFaqProps) {
  const [guideTab, setGuideTab] = useState<'preeti' | 'altcodes' | 'romanized'>(
    'preeti',
  );
  const [filterText, setFilterText] = useState('');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const filteredGuide = useMemo(() => {
    const list =
      guideTab === 'preeti'
        ? PREETI_KEY_GUIDE
        : guideTab === 'altcodes'
          ? ALT_CODE_KEY_GUIDE
          : ROMANIZED_KEY_GUIDE;
    const q = filterText.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (row) =>
        row.key.toLowerCase().includes(q) ||
        row.char.toLowerCase().includes(q) ||
        row.example.toLowerCase().includes(q),
    );
  }, [guideTab, filterText]);

  return (
    <div className="space-y-6">
      {/* Supported Fonts & Keyboard Cheat Sheet */}
      <section
        id="typing-guide"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {lang === 'ne'
                ? 'नेपाली फन्ट, Alt+Code र टाइपिङ गाइड'
                : 'Supported Fonts, Alt+Codes & Typing Guide'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ne'
                ? 'प्रीति, Alt+0170 जस्ता सर्टकट नम्बर, कान्तिपुर, सगरमाथा, हिमाली, PCS नेपाली र रोमनाइज्ड की-म्याप'
                : 'Quick reference for Preeti keys, Alt+0xxx numeric shortcuts, Kantipur, Sagarmatha, Himali, PCS Nepali, and Romanized typing'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setGuideTab('preeti')}
                className={`min-h-[36px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  guideTab === 'preeti'
                    ? 'bg-white text-red-700 shadow-xs dark:bg-slate-900 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Preeti Layout
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('altcodes')}
                className={`min-h-[36px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  guideTab === 'altcodes'
                    ? 'bg-white text-red-700 shadow-xs dark:bg-slate-900 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Alt+0xxx Codes
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('romanized')}
                className={`min-h-[36px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  guideTab === 'romanized'
                    ? 'bg-white text-red-700 shadow-xs dark:bg-slate-900 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Romanized Map
              </button>
            </div>

            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={
                lang === 'ne' ? 'अक्षर वा 0170 खोज्नुहोस्...' : 'Filter keys or 0170...'
              }
              aria-label="Filter typing keys"
              className="h-9 rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Clean Unboxed Supported Font Index */}
        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-b border-slate-200/80 pb-4 sm:grid-cols-4 dark:border-slate-800">
          {NEPALI_FONTS.map((f) => (
            <div key={f.id}>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                {lang === 'ne' ? f.nepaliName : f.name}
              </div>
              <div className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                {f.description}
              </div>
            </div>
          ))}
        </div>

        {/* Keymap Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4 font-semibold">
                  {lang === 'ne' ? 'किबोर्ड कुञ्जी (Keystroke)' : 'Keystroke'}
                </th>
                <th className="py-2 pr-4 font-semibold">
                  {lang === 'ne' ? 'नेपाली अक्षर' : 'Nepali Character'}
                </th>
                <th className="py-2 font-semibold">
                  {lang === 'ne' ? 'उदाहरण' : 'Example'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredGuide.map((row) => (
                <tr
                  key={row.key}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="font-mono-tabular py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-200">
                    {row.key}
                  </td>
                  <td className="font-nepali py-2.5 pr-4 text-sm font-semibold text-red-700 dark:text-red-400">
                    {row.char}
                  </td>
                  <td className="font-nepali py-2.5 text-slate-600 dark:text-slate-400">
                    {row.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {lang === 'ne'
            ? 'प्रायः सोधिने प्रश्नहरू (FAQ)'
            : 'Frequently Asked Questions'}
        </h2>
        <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {FAQS.map((item, idx) => {
            const open = openFaqIdx === idx;
            return (
              <div key={item.qEn} className="py-3">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaqIdx(open ? null : idx)}
                  className="flex min-h-[40px] w-full items-center justify-between gap-4 text-left text-sm font-semibold text-slate-900 hover:text-red-700 dark:text-slate-100 dark:hover:text-red-400"
                >
                  <span className="font-nepali">
                    {lang === 'ne' ? item.qNe : item.qEn}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {open && (
                  <p className="font-nepali mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {lang === 'ne' ? item.aNe : item.aEn}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Privacy Policy & Terms Modal */}
      {showPrivacyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h2
                id="privacy-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {lang === 'ne'
                  ? 'गोपनीयता नीति र सर्तहरू — unicode.pabansubedi.com.np'
                  : 'Privacy Policy & Terms — unicode.pabansubedi.com.np'}
              </h2>
              <button
                type="button"
                onClick={onClosePrivacyModal}
                className="min-h-[36px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
              >
                {lang === 'ne' ? 'बन्द गर्नुहोस्' : 'Close'}
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                <strong>1. Local Browser Processing:</strong> All Preeti to Unicode,
                Unicode to Preeti, multi-font conversions, Romanized typing, and BS–AD
                date conversions execute entirely within your browser. We do not transmit,
                log, or store your typed documents on any server.
              </p>
              <p>
                <strong>2. Browser Storage:</strong> Recent conversion snippets and your
                theme/language preferences are stored strictly inside your own device&apos;s
                browser <code className="font-mono-tabular">localStorage</code> and can
                be cleared anytime.
              </p>
              <p>
                <strong>3. Usage Terms:</strong> This tool is provided free for personal,
                educational, and office Nepali typesetting use.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
