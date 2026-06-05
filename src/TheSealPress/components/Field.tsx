// The Field — single-column feature feed of buried seals from all
// players. Each card: avatar + name + ago + image + inscription +
// Mark/Respond counts. Tap avatar/name → open user's Aigram profile.
//
// Rules in play:
//   · scroll-vs-click: inside scrollable list, row taps use onClick
//     (NOT onPointerDown). Otherwise gestures can't scroll past rows.
//   · cross-user-avatar: every cross-user surface shows avatar + name.
//   · cross-user-profile-tap: avatar+name opens the user's profile.

import { openAigramProfile, isInAigram } from '@shared/runtime/bridge';
import { relativeAgo } from '../utils/day';
import { iconLookup } from '../hooks/useOracle';
import { useEffect, useState } from 'react';
import type { FieldEntry } from '../hooks/useField';

interface Props {
  entries: FieldEntry[];
  loaded: boolean;
  onMark: (sealId: string) => void;
  marked: Set<string>;        // sealIds the player has already marked
  selfUserId?: string;
}

export default function Field({ entries, loaded, onMark, marked, selfUserId }: Props) {
  if (!loaded) {
    return (
      <div className="tsp-field tsp-field--empty">
        <em>opening the field…</em>
      </div>
    );
  }
  if (entries.length === 0) {
    return (
      <div className="tsp-field tsp-field--empty">
        <h3>The field is quiet tonight.</h3>
        <p>Press the first seal — bury it here for everyone.</p>
      </div>
    );
  }
  return (
    <div className="tsp-field">
      <div className="tsp-field__hd">
        <h2 className="tsp-field__title">The Field</h2>
        <div className="tsp-field__count">{entries.length} BURIED</div>
      </div>
      <div className="tsp-field__sub">Tonight's buried seals — scroll the dig.</div>
      <div className="tsp-field__rule" />

      <div className="tsp-field__feed">
        {entries.map((entry) => (
          <FieldCard
            key={entry.seal.id}
            entry={entry}
            isSelf={entry.userId === selfUserId}
            isMarked={marked.has(entry.seal.id)}
            onMark={() => onMark(entry.seal.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FieldCard({
  entry, isSelf, isMarked, onMark,
}: {
  entry: FieldEntry; isSelf: boolean; isMarked: boolean; onMark: () => void;
}) {
  const { seal, userName, userAvatarUrl, userId } = entry;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const ago = relativeAgo(seal.ts, 'en');
  // unused vars guarded — keeps `now` causing re-render of `ago`
  void now;

  const initial = (userName || '?').charAt(0).toUpperCase();
  const handleAuthorTap = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!isInAigram || isSelf || !userId) return;
    openAigramProfile(userId);
  };

  return (
    <div className="tsp-seal">
      <div className="tsp-seal__author">
        {isSelf ? (
          <>
            <span className="tsp-seal__avatar tsp-seal__avatar--self">{initial}</span>
            <span className="tsp-seal__name tsp-seal__name--self">YOU</span>
          </>
        ) : (
          <button
            className="tsp-seal__author-btn"
            onClick={handleAuthorTap}
            disabled={!isInAigram}
          >
            {userAvatarUrl
              ? <img className="tsp-seal__avatar" src={userAvatarUrl} alt="" draggable={false} />
              : <span className="tsp-seal__avatar">{initial}</span>}
            <span className="tsp-seal__name">{userName || '—'}</span>
          </button>
        )}
        <span className="tsp-seal__ago">
          {ago}
          {seal.blindPress && <span className="tsp-seal__blind">◌</span>}
        </span>
      </div>

      <div className="tsp-seal__img">
        <img src={seal.imageUrl} alt="" draggable={false} />
      </div>

      <div className="tsp-seal__inscription">{seal.inscription}</div>

      <div className="tsp-seal__actions">
        <button
          className={`tsp-seal__act${isMarked ? ' is-marked' : ''}`}
          onClick={onMark}
          disabled={isMarked || isSelf}
          title={isSelf ? 'your own seal' : isMarked ? 'already marked' : 'mark'}
        >
          <span className="glyph">◇</span>
          {isMarked ? 'Marked' : 'Mark'}
        </button>
        <FieldIconBadge iconKey={seal.iconKey} />
      </div>
    </div>
  );
}

function FieldIconBadge({ iconKey }: { iconKey: string }) {
  const def = iconLookup(iconKey);
  if (!def) return null;
  return (
    <span className="tsp-seal__iconbadge">
      {def.name.toLowerCase()}
    </span>
  );
}
