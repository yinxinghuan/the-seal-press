// The Field — single-column feature feed of buried seals from all
// players. Each card: avatar + name + ago + image + inscription +
// Mark/Respond counts. Tap avatar/name → open user's Aigram profile.
//
// Rules in play:
//   · scroll-vs-click: inside scrollable list, row taps use onClick
//     (NOT onPointerDown). Otherwise gestures can't scroll past rows.
//   · cross-user-avatar: every cross-user surface shows avatar + name.
//   · cross-user-profile-tap: avatar+name opens the user's profile.

import { openAigramProfile, isInAigramNow } from '@shared/runtime/bridge';
import { relativeAgo } from '../utils/day';
import { iconLookup } from '../hooks/useOracle';
import { playLike, playUnlike, hapticTap } from '../utils/audio';
import { useEffect, useRef, useState } from 'react';
import type { FieldEntry } from '../hooks/useField';

export interface LikeState { count: number; liked: boolean; }

interface Props {
  entries: FieldEntry[];
  loaded: boolean;
  likeInfo: Map<string, LikeState>;
  onToggleLike: (sealId: string) => void;
  selfUserId?: string;
  onOpen: (entry: FieldEntry) => void;
}

export default function Field({ entries, loaded, likeInfo, onToggleLike, selfUserId, onOpen }: Props) {
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
        <p>Press the first seal — it appears here for everyone.</p>
      </div>
    );
  }
  return (
    <div className="tsp-field">
      <div className="tsp-field__hd">
        <h2 className="tsp-field__title">The Field</h2>
        <div className="tsp-field__count">{entries.length} SEALS</div>
      </div>
      <div className="tsp-field__sub">Every seal pressed tonight — scroll the field.</div>
      <div className="tsp-field__rule" />

      <div className="tsp-field__feed">
        {entries.map((entry) => (
          <FieldCard
            key={entry.seal.id}
            entry={entry}
            isSelf={entry.userId === selfUserId}
            like={likeInfo.get(entry.seal.id) ?? { count: 0, liked: false }}
            onLike={() => onToggleLike(entry.seal.id)}
            onOpen={() => onOpen(entry)}
          />
        ))}
      </div>
    </div>
  );
}

function FieldCard({
  entry, isSelf, like, onLike, onOpen,
}: {
  entry: FieldEntry; isSelf: boolean; like: LikeState; onLike: () => void; onOpen: () => void;
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
    if (!isInAigramNow() || isSelf || !userId) return;
    openAigramProfile(userId);
  };

  const [bursting, setBursting] = useState(false);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (burstTimer.current) clearTimeout(burstTimer.current); }, []);
  const handleLikeTap = () => {
    if (like.liked) playUnlike(); else playLike();
    hapticTap();
    setBursting(true);
    if (burstTimer.current) clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBursting(false), 520);
    onLike();
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
            disabled={!isInAigramNow()}
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

      <div className="tsp-seal__img" onClick={onOpen} role="button">
        <img src={seal.imageUrl} alt="" draggable={false} />
      </div>

      <div className="tsp-seal__inscription" onClick={onOpen}>{seal.inscription}</div>

      <div className="tsp-seal__actions">
        <button
          className={`tsp-seal__act${like.liked ? ' is-liked' : ''}${bursting ? ' is-bursting' : ''}`}
          onClick={handleLikeTap}
          data-no-feedback
        >
          <span className="glyph">{like.liked ? '♥' : '♡'}</span>
          {like.count > 0 ? like.count : 'Like'}
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
