// Outer-silhouette variants. RNG-picked per press. The model produces
// these reliably (square / disc / hex / arch / scroll / fragment).
// True triangle + extreme aspect ratios were unreliable, so omitted.

export interface SilhouetteDef {
  key: string;
  /** Prose used inside the gen-image prompt's silhouette slot. */
  prompt: string;
  /** Relative draw weight when RNGing per press. Square more common. */
  weight: number;
}

export const SILHOUETTES: SilhouetteDef[] = [
  { key: 'square',
    prompt: 'rectangular flat clay tablet',
    weight: 30 },
  { key: 'disc',
    prompt: 'perfect circular disc — the silhouette is a CIRCLE, NOT a square',
    weight: 15 },
  { key: 'hex',
    prompt: 'regular HEXAGON with six straight sides of equal length',
    weight: 12 },
  { key: 'arch',
    prompt: 'arched-top tombstone-shaped tablet — rectangular body with a rounded arch at the top',
    weight: 12 },
  { key: 'scroll',
    prompt: 'tall narrow vertical tablet with rolled scroll-like ends top and bottom',
    weight: 8 },
  { key: 'fragment',
    prompt: 'irregular broken pottery fragment with jagged organic edges',
    weight: 8 },
  { key: 'wide',
    prompt: 'wide horizontal banner-shaped clay tablet, distinctly wider than tall',
    weight: 8 },
  { key: 'oval',
    prompt: 'rounded oval pendant shape, NOT a circle, longer than wide',
    weight: 7 },
];

export function silhouetteByKey(key: string): SilhouetteDef {
  return SILHOUETTES.find(s => s.key === key) ?? SILHOUETTES[0];
}
