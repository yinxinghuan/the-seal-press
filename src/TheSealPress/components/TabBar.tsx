// Bottom tab bar — Field · Press pill · Altar. Press pill shows
// remaining quota X/3. When 0/3, button is disabled and shows a
// countdown to local midnight.
import { useEffect, useState } from 'react';
import { formatCountdown, msUntilMidnight } from '../utils/day';

export type Tab = 'field' | 'altar';

interface Props {
  active: Tab;
  pressRemaining: number;   // 0..MAX_PRESS_PER_DAY
  pressMax: number;
  onTab: (t: Tab) => void;
  onPress: () => void;       // tap Press CTA
}

export default function TabBar({ active, pressRemaining, pressMax, onTab, onPress }: Props) {
  const exhausted = pressRemaining <= 0;
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    if (!exhausted) return;
    const update = () => setCountdown(formatCountdown(msUntilMidnight()));
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [exhausted]);

  return (
    <div className="tsp-tabbar">
      <button
        className={`tsp-tabbar__btn${active === 'field' ? ' is-active' : ''}`}
        onPointerDown={() => onTab('field')}
      >
        <span className="glyph">⌖</span>
        Field
      </button>

      <button
        className={`tsp-tabbar__btn tsp-tabbar__press${exhausted ? ' is-exhausted' : ''}`}
        onPointerDown={onPress}
      >
        {exhausted ? (
          <>
            <span className="label">Refills in</span>
            <span className="quota">{countdown}</span>
          </>
        ) : (
          <>
            <span className="label">Press</span>
            <span className="quota">{pressRemaining}/{pressMax}</span>
          </>
        )}
      </button>

      <button
        className={`tsp-tabbar__btn${active === 'altar' ? ' is-active' : ''}`}
        onPointerDown={() => onTab('altar')}
      >
        <span className="glyph">◯</span>
        Altar
      </button>
    </div>
  );
}
