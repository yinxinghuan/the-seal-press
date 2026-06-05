// Reveal + Cast — the result + 3 destination cards. After tap the
// chosen destination, the seal is persisted and we return to Field
// (if buried) or Altar (if kept).
import { materialByKey } from '../data/materials';
import { silhouetteByKey } from '../data/silhouettes';
import { iconLookup } from '../hooks/useOracle';
import type { Seal, CastDestination } from '../types';

interface Props {
  seal: Seal;
  onCast: (dest: CastDestination) => void;
}

export default function Reveal({ seal, onCast }: Props) {
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

      <div className="tsp-reveal__cast-title">where will this seal live?</div>
      <div className="tsp-reveal__cast">
        <button
          className="tsp-cast"
          onPointerDown={() => onCast('kept')}
        >
          <span className="tsp-cast__glyph">◯</span>
          <div className="tsp-cast__main">Keep</div>
          <div className="tsp-cast__sub">Altar · only you</div>
        </button>
        <button
          className="tsp-cast tsp-cast--primary"
          onPointerDown={() => onCast('buried')}
        >
          <span className="tsp-cast__glyph">⌖</span>
          <div className="tsp-cast__main">Bury</div>
          <div className="tsp-cast__sub">Field · all see</div>
        </button>
      </div>
    </div>
  );
}
