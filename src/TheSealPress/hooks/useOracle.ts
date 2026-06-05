// Two oracle modes:
//
// 1. Inscribed press → pick the icon whose keywords best match the
//    inscription. Keyword overlap + small randomness for variety.
//
// 2. Blind press → use the username as the seed. Hash the username +
//    a press counter so the same user pressing 3 times in a row gets
//    3 different icons + 3 different generated inscriptions.
//
// LLM-driven version (with proper anti-repeat) is a v1.1 upgrade; this
// JS-only version ships v1 with the same conceptual mechanic.

import { ICONS, type IconDef } from '../data/icons';

const BLIND_LINES: ReadonlyArray<string> = [
  "the small bright window we carried",
  "for what stays when you leave",
  "i was the one who saw",
  "the morning the news came",
  "for the day my father stopped speaking",
  "we kept calling it the cloud",
  "lines on the screen",
  "summers when the air was still",
  "the apartment we never moved into",
  "i saw you in the crowd and didn't say",
  "for what i didn't say",
  "the room with the open window",
  "how it always finds me",
  "what was left after",
  "a year of letting it bloom",
  "for the year I stopped pretending",
  "the last call before he hung up",
  "small things, all of them mine",
  "the door I shouldn't have opened",
  "3:42am, again",
  "all the photos I didn't take",
  "for the friends who never wrote back",
  "the bus that took the long way",
  "every line I underlined and forgot",
  "for the songs that played twice",
  "the silence after I hung up",
  "what the rain knew first",
  "the years we counted wrong",
];

function tokens(s: string): string[] {
  return s.toLowerCase().match(/[a-z一-鿿]+/g) ?? [];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export interface OracleResult {
  iconKey: string;
  inscription: string;
  blindPress: boolean;
}

export function consultOracle(
  inscription: string,
  username: string,
  pressCount: number,
  recentIconKeys: string[],
): OracleResult {
  const trimmed = inscription.trim();
  const isBlind = trimmed.length === 0;

  if (isBlind) {
    // Blind path: pick icon + generated inscription, seeded so the same
    // user across presses gets distinct results.
    const seed = hash(username + ':' + pressCount);
    const pool = ICONS.filter(i => !recentIconKeys.includes(i.key));
    const candidates = pool.length ? pool : ICONS;
    const icon = candidates[seed % candidates.length];
    const line = BLIND_LINES[(seed >> 8) % BLIND_LINES.length];
    return { iconKey: icon.key, inscription: line, blindPress: true };
  }

  // Inscribed path: keyword overlap scoring + minor RNG tiebreaking.
  const inputTokens = new Set(tokens(trimmed));
  const scored = ICONS.map((icon, idx) => {
    let score = 0;
    for (const kw of icon.keywords) {
      if (inputTokens.has(kw)) score += 2;
      // Loose stem match (e.g. "leaving" ~ "leave")
      else if ([...inputTokens].some(t => t.startsWith(kw.slice(0, 4)))) score += 1;
    }
    // Penalise recent picks so the user sees variety even when they
    // type semantically similar inscriptions on consecutive presses.
    if (recentIconKeys.includes(icon.key)) score -= 1;
    // Light jitter so identical-score ties don't always pick the first.
    score += Math.random() * 0.5;
    return { icon, score, idx };
  }).sort((a, b) => b.score - a.score);

  // Best of top-3 with weighted preference.
  const top = scored.slice(0, 3);
  const r = Math.random();
  const pick = r < 0.7 ? top[0] : r < 0.9 ? top[1] : top[2];
  return { iconKey: pick.icon.key, inscription: trimmed, blindPress: false };
}

export function iconLookup(key: string): IconDef | undefined {
  return ICONS.find(i => i.key === key);
}
