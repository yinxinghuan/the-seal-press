// Read-only detail overlay for an already-pressed seal. Opened by tapping
// a card in the Field (with author chip) or a cell in the Altar (own seal).
// No cast actions — pure inspection. Close via the X or the backdrop.
import { useEffect, useRef, useState } from 'react';
import { materialByKey } from '../data/materials';
import { silhouetteByKey } from '../data/silhouettes';
import { iconLookup } from '../hooks/useOracle';
import { relativeAgo } from '../utils/day';
import { openAigramProfile, isInAigramNow } from '@shared/runtime/bridge';
import { timeAgo, type GuestMessage } from '@shared/social/guestbook';
import { playLike, playUnlike, hapticTap } from '../utils/audio';
import type { Seal } from '../types';

const ALTERU_APP_URL = 'https://apps.apple.com/app/id6769646546';

export interface DetailAuthor {
  userId?: string;
  userName?: string;
  userAvatarUrl?: string;
  isSelf: boolean;
}

interface Props {
  seal: Seal;
  author?: DetailAuthor;   // present when opened from the Field
  like: { count: number; liked: boolean };
  /** Public notes on this seal (wall ∪ my own, oldest-first). */
  thread: GuestMessage[];
  selfUserId?: string;
  onToggleLike: () => void;
  onSendNote: (text: string) => void;
  onClose: () => void;
  onDelete: (sealId: string) => void;
}

export default function SealDetail({ seal, author, like, thread, selfUserId, onToggleLike, onSendNote, onClose, onDelete }: Props) {
  // Only your own seals can be discarded. From the Altar there's no author;
  // from the Field, only when it's yours. A buried seal lives in your own
  // save, so discarding also pulls it out of the public Field.
  const canDelete = !author || author.isSelf;
  const [confirming, setConfirming] = useState(false);
  const icon = iconLookup(seal.iconKey);
  const material = materialByKey(seal.materialKey);
  const silhouette = silhouetteByKey(seal.silhouetteKey);
  const metaTag = [
    material.key.replace(/_/g, ' '),
    silhouette.key,
    icon?.name?.toLowerCase() ?? '',
  ].filter(Boolean).join(' · ').toUpperCase();

  const initial = (author?.userName || '?').charAt(0).toUpperCase();
  const handleAuthorTap = () => {
    if (!author || author.isSelf || !isInAigramNow() || !author.userId) return;
    openAigramProfile(author.userId);
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
    onToggleLike();
  };

  return (
    <div className="tsp-detail" onClick={onClose}>
      <div className="tsp-detail__card" onClick={e => e.stopPropagation()}>
        <button className="tsp-detail__close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div
          className="tsp-detail__img"
          onClick={onClose}
          role="button"
          aria-label="Close"
        >
          <img src={seal.imageUrl} alt="" draggable={false} />
        </div>

        {seal.inscription && (
          <div className="tsp-detail__inscription">{seal.inscription}</div>
        )}

        <div className="tsp-detail__metatag">{metaTag}</div>

        <div className="tsp-detail__foot">
          {author && !author.isSelf ? (
            <button
              className="tsp-detail__author"
              onClick={handleAuthorTap}
              disabled={!isInAigramNow()}
            >
              {author.userAvatarUrl
                ? <img className="tsp-detail__avatar" src={author.userAvatarUrl} alt="" draggable={false} />
                : <span className="tsp-detail__avatar">{initial}</span>}
              <span className="tsp-detail__name">{author.userName || '—'}</span>
            </button>
          ) : (
            <span className="tsp-detail__name tsp-detail__name--self">
              {author ? 'YOU' : `MONOGRAM · ${seal.monogram}`}
            </span>
          )}
          <span className="tsp-detail__ago">
            {relativeAgo(seal.ts, 'en')}
            {seal.blindPress && <span className="tsp-detail__blind"> ◌</span>}
          </span>
        </div>

        {/* Public guestbook — notes left on this seal, with a compose box.
            Best-effort cross-user display + author ping (see @shared/social). */}
        <div className="tsp-notes">
          <div className="tsp-notes__eyebrow">
            — notes{thread.length > 0 ? ` · ${thread.length}` : ''} —
          </div>
          {thread.length > 0 ? (
            <ul className="tsp-notes__list">
              {thread.map(m => (
                <NoteRow key={m.id} msg={m} selfUserId={selfUserId} />
              ))}
            </ul>
          ) : (
            <div className="tsp-notes__empty">No notes yet — be the first.</div>
          )}
          {isInAigramNow() ? (
            <Compose onSend={onSendNote} />
          ) : (
            <div className="tsp-notes__empty tsp-notes__download">
              <span>Open in AlterU to leave a note.</span>
              <a href={ALTERU_APP_URL} target="_blank" rel="noopener noreferrer">
                Get AlterU on the App Store
              </a>
            </div>
          )}
        </div>

        <button
          className={`tsp-detail__like${like.liked ? ' is-liked' : ''}${bursting ? ' is-bursting' : ''}`}
          onClick={handleLikeTap}
          data-no-feedback
        >
          <span className="tsp-detail__like-glyph">{like.liked ? '♥' : '♡'}</span>
          <span className="tsp-detail__like-count">
            {like.count > 0
              ? `${like.count} ${like.count === 1 ? 'like' : 'likes'}`
              : 'Be the first to like'}
          </span>
        </button>

        {canDelete && (
          <button
            className={`tsp-detail__discard${confirming ? ' is-confirming' : ''}`}
            onClick={() => (confirming ? onDelete(seal.id) : setConfirming(true))}
          >
            {confirming ? 'Tap again to destroy' : 'Discard this seal'}
          </button>
        )}
      </div>
    </div>
  );
}

// One note: author chip (tappable → profile, self shows "YOU"), text, time.
function NoteRow({ msg, selfUserId }: { msg: GuestMessage; selfUserId?: string }) {
  const mine = !!msg.fromUserId && msg.fromUserId === selfUserId;
  const name = mine ? 'YOU' : (msg.userName || 'someone');
  const initial = (msg.userName || '?').charAt(0).toUpperCase();
  const tappable = !mine && !!msg.fromUserId && isInAigramNow();
  const head = (
    <span className="tsp-note__head">
      {msg.userAvatarUrl
        ? <img className="tsp-note__avatar" src={msg.userAvatarUrl} alt="" draggable={false} />
        : <span className="tsp-note__avatar">{initial}</span>}
      <span className={`tsp-note__name${mine ? ' tsp-note__name--self' : ''}`}>{name}</span>
      <span className="tsp-note__time">{timeAgo(msg.ts, 'en')}</span>
    </span>
  );
  return (
    <li className="tsp-note">
      {tappable ? (
        <button className="tsp-note__chip" onClick={() => openAigramProfile(msg.fromUserId!)}>
          {head}
        </button>
      ) : head}
      <p className="tsp-note__text">{msg.text}</p>
    </li>
  );
}

// Compose box — controlled input + send; clicks don't bubble to the backdrop.
function Compose({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };
  return (
    <div className="tsp-compose" onClick={e => e.stopPropagation()}>
      <input
        className="tsp-compose__input"
        value={text}
        maxLength={140}
        placeholder="Leave a note…"
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
      />
      <button
        className="tsp-compose__send"
        disabled={!text.trim()}
        onClick={submit}
      >
        Send
      </button>
    </div>
  );
}
