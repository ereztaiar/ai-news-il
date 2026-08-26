// Raw source slugs (from scripts/fetch_news.sh's FEEDS keys) mapped to a
// clean Hebrew display name — the slugs themselves leak like internal IDs
// when shown next to Hebrew headlines and UI chrome.
const SOURCE_LABELS: Record<string, string> = {
  ynet: 'ynet',
  walla: 'וואלה',
  timesofisrael: 'טיימס אוף ישראל',
  jpost: 'ג׳רוזלם פוסט',
  arutz_sheva: 'ערוץ 7',
  makor_rishon: 'מקור ראשון',
  haaretz_en: 'הארץ (אנגלית)',
}

export function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? source
}
