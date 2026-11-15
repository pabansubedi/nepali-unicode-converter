export type AdSlotVariant = 'sidebar-top' | 'sidebar-sticky' | 'in-content';

interface AdSenseSlotProps {
  variant: AdSlotVariant;
  lang: 'en' | 'ne';
}

const SLOT_CONFIG: Record<
  AdSlotVariant,
  {
    ariaLabel: string;
    minHeightClass: string;
    slotName: string;
  }
> = {
  'sidebar-top': {
    ariaLabel: 'Sidebar Advertisement',
    minHeightClass: 'min-h-[250px]',
    slotName: 'SIDEBAR_TOP_300x250',
  },
  'sidebar-sticky': {
    ariaLabel: 'Sticky Sidebar Advertisement',
    minHeightClass: 'min-h-[320px] lg:min-h-[500px]',
    slotName: 'SIDEBAR_STICKY_300x600',
  },
  'in-content': {
    ariaLabel: 'Banner Advertisement',
    minHeightClass: 'min-h-[96px]',
    slotName: 'IN_CONTENT_RESPONSIVE',
  },
};

export function AdSenseSlot({variant, lang}: AdSenseSlotProps) {
  const cfg = SLOT_CONFIG[variant];

  return (
    <aside
      aria-label={cfg.ariaLabel}
      data-adsense-slot={cfg.slotName}
      className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/70"
    >
      <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
        <span className="uppercase tracking-wider">
          {lang === 'ne' ? 'विज्ञापन' : 'Advertisement'}
        </span>
      </div>

      {/*
        Google AdSense Slot (${cfg.slotName}):
        Replace the container below with your <ins class="adsbygoogle"> unit before publishing.
      */}
      <div
        className={`flex items-center justify-center rounded-lg bg-slate-50/90 dark:bg-slate-950/60 ${cfg.minHeightClass}`}
      >
        <span className="text-xs font-medium text-slate-400 dark:text-slate-600">
          {lang === 'ne' ? 'प्रायोजित स्थान' : 'Sponsored Space'}
        </span>
      </div>
    </aside>
  );
}
