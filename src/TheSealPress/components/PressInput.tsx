// Single-screen optional input. Either:
//   1. User writes a line → semantic match picks icon → press
//   2. User taps "Blind press" with empty input → username-seeded RNG
//      picks icon + generates inscription → press
import { useState } from 'react';

interface Props {
  monogram: string;
  onPress: (inscription: string) => void;
  onCancel: () => void;
}

const MAX_INSCRIPTION = 60;

export default function PressInput({ monogram, onPress, onCancel }: Props) {
  const [text, setText] = useState('');
  const remaining = MAX_INSCRIPTION - text.length;

  return (
    <div className="tsp-press">
      <div className="tsp-press__step">PRESS A SEAL · YOUR MONOGRAM “{monogram}”</div>
      <h2 className="tsp-press__title">Write a line.</h2>
      <div className="tsp-press__sub">Or skip — the universe will read your name.</div>

      <div className="tsp-press__input">
        <input
          type="text"
          autoFocus
          placeholder="what is this seal for?"
          maxLength={MAX_INSCRIPTION}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="tsp-press__meta">
          <span className={`tsp-press__counter${remaining < 10 ? ' is-low' : ''}`}>
            {remaining} <span>left</span>
          </span>
          <span className="tsp-press__hint">a single line, one thought</span>
        </div>
      </div>

      <div className="tsp-press__primary">
        <button
          className="tsp-cta tsp-cta--primary"
          onPointerDown={() => onPress(text)}
        >
          Press <span className="arrow" />
        </button>
      </div>

      <div className="tsp-press__or">
        <span className="rule" />
        <span className="or">or</span>
        <span className="rule" />
      </div>

      <button
        className="tsp-press__blind"
        onPointerDown={() => onPress('')}
      >
        <div className="tsp-press__blind-title">— Blind press —</div>
        <div className="tsp-press__blind-sub">leave it blank · the universe carves for you</div>
      </button>

      <div className="tsp-press__cancel">
        <button onPointerDown={onCancel}>
          <span className="arr">←</span> Cancel
        </button>
      </div>
    </div>
  );
}
