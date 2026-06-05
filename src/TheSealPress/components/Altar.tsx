// Personal collection — every seal you've pressed (any destination)
// + received from friends. 2-col grid, newest first.
import { relativeAgo } from '../utils/day';
import type { Seal } from '../types';

interface Props {
  seals: Seal[];
}

export default function Altar({ seals }: Props) {
  if (seals.length === 0) {
    return (
      <div className="tsp-altar tsp-altar--empty">
        <h3>Your altar is empty.</h3>
        <p>Press your first seal — keep it here forever, or bury it for everyone.</p>
      </div>
    );
  }
  return (
    <div className="tsp-altar">
      <div className="tsp-altar__hd">
        <h2 className="tsp-altar__title">Altar</h2>
        <div className="tsp-altar__count">{seals.length} KEPT</div>
      </div>
      <div className="tsp-altar__rule" />

      <div className="tsp-altar__grid">
        {seals.map((seal) => (
          <div className="tsp-altar__cell" key={seal.id}>
            <div className="tsp-altar__face">
              <img src={seal.imageUrl} alt="" draggable={false} />
            </div>
            <div className="tsp-altar__inscription">{seal.inscription}</div>
            <div className="tsp-altar__date">
              {relativeAgo(seal.ts, 'en')}
              {' · '}
              {destinationLabel(seal.destination)}
              {seal.blindPress && <span className="tsp-altar__blind"> ◌</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function destinationLabel(dest: string): string {
  switch (dest) {
    case 'kept':   return 'Kept';
    case 'buried': return 'Field';
    case 'sent':   return 'Sent';
    default:       return '';
  }
}
