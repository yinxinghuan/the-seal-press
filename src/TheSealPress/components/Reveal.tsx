// Reveal + Seal — the result + one ritual button. Every seal is public:
// pressing seals it into the Field and keeps a copy in your Altar.
import { materialByKey } from '../data/materials';
import { silhouetteByKey } from '../data/silhouettes';
import { iconLookup } from '../hooks/useOracle';
import type { Seal } from '../types';

interface Props {
  seal: Seal;
  onSeal: () => void;
}

export default function Reveal({ seal, onSeal }: Props) {
  const icon = iconLookup(seal.iconKey);
  const material = materialByKey(seal.materialKey);
  const silhouette = silhouetteByKey(seal.silhouetteKey);
  const metaTag = [
    material.key.replace(/_/g, ' '),
    silhouette.key,
    icon?.name?.toLowerCase() ?? '',
  ].filter(Boolean).join(' · ').toUpperCase();

  return (
    <div className="tsp-reveal">
      <div className="tsp-reveal__eyebrow">your seal · just now</div>
      <div className="tsp-reveal__cardwrap">
        <div className="tsp-reveal__card">
          <img src={seal.imageUrl} alt="" draggable={false} />
        </div>
      </div>

      <div className="tsp-reveal__inscription">{seal.inscription}</div>
      <div className="tsp-reveal__meta">
        <span className="tsp-reveal__metatag">{metaTag}</span>
      </div>

      <div className="tsp-reveal__cast-title">press to seal it forever</div>
      <div className="tsp-reveal__cast">
        <button
          className="tsp-cast tsp-cast--primary"
          onPointerDown={onSeal}
        >
          <span className="tsp-cast__glyph">⌖</span>
          <div className="tsp-cast__main">Seal it</div>
          <div className="tsp-cast__sub">Into the Field · everyone sees</div>
        </button>
      </div>
    </div>
  );
}
