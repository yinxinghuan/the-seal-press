// Personal collection — every seal you've pressed (any destination)
// + received from friends. 2-col grid, newest first.
import { relativeAgo } from '../utils/day';
import type { Seal } from '../types';

interface Props {
  seals: Seal[];
  onOpen: (seal: Seal) => void;
}

export default function Altar({ seals, onOpen }: Props) {
  if (seals.length === 0) {
    return (
      <div className="tsp-altar tsp-altar--empty">
        <h3>Your altar is empty.</h3>
        <p>Press your first seal. Each one is kept here and joins the Field for everyone to see.</p>
      </div>
    );
  }
  return (
    <div className="tsp-altar">
      <div className="tsp-altar__hd">
        <h2 className="tsp-altar__title">Altar</h2>
        <div className="tsp-altar__count">{seals.length} SEALS</div>
      </div>
      <div className="tsp-altar__rule" />

      <div className="tsp-altar__grid">
        {seals.map((seal) => (
          <div className="tsp-altar__cell" key={seal.id} onClick={() => onOpen(seal)} role="button">
            <div className="tsp-altar__face">
              <img src={seal.imageUrl} alt="" draggable={false} />
            </div>
            <div className="tsp-altar__inscription">{seal.inscription}</div>
            <div className="tsp-altar__date">
              {relativeAgo(seal.ts, 'en')}
              {seal.blindPress && <span className="tsp-altar__blind"> ◌</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
