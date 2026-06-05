// Material variants — clay colors + cross-medium options.
// Common clay colors are weighted higher than exotic materials so the
// dominant "feel" stays archaeological clay; exotic materials (bronze,
// jade, bone, obsidian) appear as rarer finds.

export interface MaterialDef {
  key: string;
  /** Prose used inside the gen-image prompt's material slot. */
  prompt: string;
  weight: number;
}

export const MATERIALS: MaterialDef[] = [
  // Clay color palette (common)
  { key: 'terracotta',
    prompt: 'matte unglazed deep red terracotta clay, debossed carving',
    weight: 22 },
  { key: 'ochre',
    prompt: 'matte unglazed warm ochre yellow clay, debossed carving',
    weight: 14 },
  { key: 'kaolin',
    prompt: 'matte unglazed pale chalky white kaolin clay, debossed carving',
    weight: 12 },
  { key: 'slate',
    prompt: 'matte unglazed cool dark slate grey clay, debossed carving',
    weight: 10 },
  { key: 'sand',
    prompt: 'matte unglazed pale sand-bone clay, debossed carving',
    weight: 8 },
  { key: 'basalt',
    prompt: 'matte deep matte black basalt clay, debossed carving',
    weight: 6 },
  { key: 'amber',
    prompt: 'matte unglazed warm honey-amber clay, debossed carving',
    weight: 6 },

  // Cross-medium (rarer — like finding a different kind of amulet)
  { key: 'bronze',
    prompt: 'aged bronze metal with rich green-blue verdigris patina and worn copper highlights, RAISED relief casting',
    weight: 4 },
  { key: 'jade',
    prompt: 'carved deep mossy-green jade stone with smooth polished translucent surface and faint internal veining, deep cut relief',
    weight: 3 },
  { key: 'bone',
    prompt: 'carved ivory bone with warm cream coloring, fine sepia-ink scrimshaw line work, slight age cracks',
    weight: 3 },
  { key: 'obsidian',
    prompt: 'polished black obsidian volcanic glass with mirror-glossy surface and white powder-filled debossed grooves',
    weight: 2 },
];

export function materialByKey(key: string): MaterialDef {
  return MATERIALS.find(m => m.key === key) ?? MATERIALS[0];
}
