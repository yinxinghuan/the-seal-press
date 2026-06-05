// Local-day key. Same convention as Daily Arcana.
//
// CRITICAL: daily quota MUST be derived ONLY from comparing local
// `pressDay` to `todayKey()`. NEVER OR with platform aggregate stats
// (day_click_count etc.) — they get stuck server-side and lock users
// out permanently. See memory: daily-lock-trap.

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function msUntilMidnight(): number {
  const now = new Date();
  const tmrw = new Date(now);
  tmrw.setDate(tmrw.getDate() + 1);
  tmrw.setHours(0, 0, 0, 0);
  return tmrw.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0m';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function relativeAgo(ts: number, locale: 'zh' | 'en'): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (locale === 'zh') {
    if (d > 0) return `${d}天前`;
    if (h > 0) return `${h}小时前`;
    if (m > 0) return `${m}分前`;
    return '刚刚';
  }
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return 'just now';
}
