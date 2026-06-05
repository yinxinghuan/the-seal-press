// Damage / wear variants. Heavy damage that crops into the figure
// proved to be the strongest visual variety driver in tests.

export interface DamageDef {
  key: string;
  /** Prose for the damage slot in the gen-image prompt. */
  prompt: string;
  weight: number;
}

export const DAMAGE: DamageDef[] = [
  { key: 'fresh',
    prompt: 'minimal damage, slight edge wear and fine clay grit only, the figure fully intact',
    weight: 24 },
  { key: 'chipped',
    prompt: 'noticeably chipped uneven edges with one or two weathered corners, the figure still fully visible',
    weight: 20 },
  { key: 'cracked',
    prompt: 'a thin hairline crack running across the surface, edges weathered, the figure remains visible through the crack',
    weight: 14 },
  { key: 'heavy_crack',
    prompt: 'a heavy diagonal crack splitting the surface, the central figure partially obscured by the break',
    weight: 8 },
  { key: 'corner_lost',
    prompt: 'a large chunk missing from one corner, exposing rough raw clay at the break; the missing corner takes part of the central figure with it',
    weight: 5 },
  { key: 'half_broken',
    prompt: 'ONLY HALF of the tablet survives — the other half has broken away along a jagged fracture, the central figure severely cropped at the break line',
    weight: 4 },
];

export function damageByKey(key: string): DamageDef {
  return DAMAGE.find(d => d.key === key) ?? DAMAGE[0];
}
