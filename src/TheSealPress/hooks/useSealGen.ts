// Compose the locked gen-image prompt from a press spec, RNG silhouette/
// material/damage, embed the ALTERU text mark, call useGenImage.
//
// Prompt template proven via 30+ test gens (see _seal_tests/).

import { useCallback, useState } from 'react';
import { useGenImage } from '@shared/runtime';
import { pickWeighted } from '../utils/rng';
import { iconByKey } from '../data/icons';
import { SILHOUETTES, silhouetteByKey } from '../data/silhouettes';
import { MATERIALS, materialByKey } from '../data/materials';
import { DAMAGE, damageByKey } from '../data/damage';

const ALTERU_MARK = (
  "a small workshop stamp containing the debossed all-caps text \"ALTERU\" " +
  "(exactly the 6 letters A-L-T-E-R-U, no other letters), carved into the clay surface " +
  "as a horizontal text-only stamp, significantly smaller than the central icon, " +
  "subtle but legible — like a potter's signature"
);

const DEBOSSED_ENFORCE = (
  "The carving is DEBOSSED — pressed and recessed INTO the surface, " +
  "NOT raised in relief, NOT painted on, NOT a photographic object resting on top. " +
  "EVERYTHING — borders, monogram, central icon, workshop stamp — " +
  "is rendered as the same kind of recessed line-carving in the body of the artifact. " +
  "The whole image reads as ONE solid carved artifact with crisp grooved lines."
);

export interface SealSpec {
  monogram: string;       // single capital
  iconKey: string;
  inscription: string;    // optional empty string in blind mode (still passed for context)
}

export interface SealResult {
  imageUrl: string;
  silhouetteKey: string;
  materialKey: string;
  damageKey: string;
}

export function useSealGen() {
  const gen = useGenImage();
  const [stage, setStage] = useState<'idle' | 'gen' | 'done' | 'error'>('idle');

  const generate = useCallback(async (spec: SealSpec): Promise<SealResult> => {
    setStage('gen');
    const silhouette = pickWeighted(SILHOUETTES);
    const material = pickWeighted(MATERIALS);
    const damage = pickWeighted(DAMAGE);
    const icon = iconByKey(spec.iconKey);

    const prompt = [
      "photograph of an ancient amulet.",
      silhouette.prompt + ".",
      material.prompt + ".",
      `DAMAGE: ${damage.prompt}.`,
      DEBOSSED_ENFORCE,
      "Composition:",
      "  · Top border: a horizontal band of repeating geometric ornamental motif.",
      "  · Bottom border: a matching geometric ornamental band.",
      `  · Top centre: a small CIRCLE MEDALLION containing a single debossed capital letter "${spec.monogram}".`,
      `  · Central: ${icon.prompt}, single iconic debossed carving filling the middle, rendered with archaic abstraction (NOT photoreal, NOT 3D placed on top).`,
      `  · Lower-right corner: ${ALTERU_MARK}.`,
      "No fingerprints, no extra text beyond the monogram letter and the ALTERU workshop stamp.",
      "Museum object photography, flat raking sidelight, jet pure black backdrop, slight grain, shot from directly above.",
    ].join(' ');

    try {
      const imageUrl = await gen.generate({ prompt });
      setStage('done');
      return {
        imageUrl,
        silhouetteKey: silhouette.key,
        materialKey: material.key,
        damageKey: damage.key,
      };
    } catch (e) {
      setStage('error');
      throw e;
    }
  }, [gen]);

  // Used by the kiln-fire screen to show the chosen silhouette/material
  // BEFORE the result arrives, so the user knows something is forming.
  // (Currently we keep these secret until reveal — see TheSealPress.)
  const lookupSilhouette = useCallback((key: string) => silhouetteByKey(key), []);
  const lookupMaterial = useCallback((key: string) => materialByKey(key), []);
  const lookupDamage = useCallback((key: string) => damageByKey(key), []);

  return {
    generate,
    stage,
    loading: gen.loading,
    error: gen.error,
    reset: () => setStage('idle'),
    lookupSilhouette,
    lookupMaterial,
    lookupDamage,
  };
}
