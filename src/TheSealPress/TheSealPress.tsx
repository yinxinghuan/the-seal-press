import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSave } from '@shared/save';
import { useGameEvent } from '@shared/runtime';
import { telegramId } from '@shared/runtime/bridge';
import {
  appendMessage,
  guestbookNotifyConfig,
  newMessage,
  threadFor,
} from '@shared/social/guestbook';
import TopBar from './components/TopBar';
import TabBar, { type Tab } from './components/TabBar';
import Field from './components/Field';
import PressInput from './components/PressInput';
import Pressing from './components/Pressing';
import Reveal from './components/Reveal';
import Altar from './components/Altar';
import SealDetail, { type DetailAuthor } from './components/SealDetail';
import Watermark from './components/Watermark';
import { useSelfProfile } from './hooks/useSelfProfile';
import { useSealGen } from './hooks/useSealGen';
import { useField, type FieldEntry } from './hooks/useField';
import { consultOracle } from './hooks/useOracle';
import { todayKey, formatCountdown, msUntilMidnight } from './utils/day';
import { preloadImage } from './utils/preload';
import { newId } from './utils/rng';
import { installGlobalTapFeedback } from './utils/audio';
import type { Seal, SealSave, Phase } from './types';
import { MAX_PRESS_PER_DAY } from './types';
import './TheSealPress.less';

const GAME_ID = 'the-seal-press';

export default function TheSealPress() {
  const { savedData, persist } = useGameSave<SealSave>(GAME_ID);
  const profile = useSelfProfile();
  const sealGen = useSealGen();
  const field = useField();
  const events = useGameEvent();

  // Global tap-sound + haptic on every button / role=button / a[href]
  // unless it carries [data-no-feedback]. Lazy-init AudioContext so we
  // don't leak audio into the previous game while Aigram preloads.
  useEffect(() => { installGlobalTapFeedback(); }, []);

  // Local mirror — useGameSave.savedData never updates after persist().
  const [mirror, setMirror] = useState<SealSave | undefined>(undefined);
  useEffect(() => {
    if (mirror === undefined && savedData !== undefined) {
      const initialMonogram =
        savedData?.monogram ?? deriveDefaultMonogram(profile?.name);
      setMirror({
        seals: savedData?.seals ?? [],
        likes: savedData?.likes ?? [],
        pressDay: savedData?.pressDay,
        pressUsedToday: savedData?.pressUsedToday ?? 0,
        monogram: initialMonogram,
        onboarded: savedData?.onboarded ?? false,
        messages: savedData?.messages ?? [],
      });
    }
  }, [savedData, mirror, profile?.name]);

  // Update monogram once profile loads if user hadn't set one.
  useEffect(() => {
    if (!mirror || !profile?.name) return;
    if (mirror.monogram && mirror.monogram !== '?') return;
    const derived = deriveDefaultMonogram(profile.name);
    if (derived !== mirror.monogram) {
      const next = { ...mirror, monogram: derived };
      setMirror(next);
      persist(next);
    }
  }, [profile?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Daily quota — derived ONLY from mirror.pressDay vs today (daily-lock-trap).
  const today = todayKey();
  const pressUsedToday = mirror?.pressDay === today ? (mirror?.pressUsedToday ?? 0) : 0;
  const pressRemaining = Math.max(0, MAX_PRESS_PER_DAY - pressUsedToday);

  // The Field feed comes from get/data/list, which is eventually-consistent
  // and may not echo the caller's own save at all. Always fold in the user's
  // OWN buried seals (from the local mirror) so they show instantly and
  // survive reloads regardless of server replication. Dedupe by seal.id.
  const fieldEntries = useMemo<FieldEntry[]>(() => {
    const mine: FieldEntry[] = (mirror?.seals ?? [])
      .filter(s => s.imageUrl)
      .map(seal => ({
        userId: telegramId || 'self',
        userName: profile?.name,
        userAvatarUrl: profile?.avatarUrl,
        seal,
      }));
    const seen = new Set<string>();
    const merged: FieldEntry[] = [];
    for (const e of [...field.entries, ...mine]) {
      if (seen.has(e.seal.id)) continue;
      seen.add(e.seal.id);
      merged.push(e);
    }
    merged.sort((a, b) => (b.seal.ts ?? 0) - (a.seal.ts ?? 0));
    return merged;
  }, [field.entries, mirror?.seals, profile?.name, profile?.avatarUrl]);

  // Per-seal like state: server count (other users, from get/data/list) +
  // your own like folded in (the read may exclude your own save). Returns
  // { count, liked } keyed by seal id, for every seal currently shown.
  const likeInfo = useMemo(() => {
    const myId = telegramId || 'self';
    const myLikes = new Set(mirror?.likes ?? []);
    const map = new Map<string, { count: number; liked: boolean }>();
    for (const e of fieldEntries) {
      const sid = e.seal.id;
      const server = field.likesBySeal.get(sid);
      let count = 0;
      if (server) for (const uid of server) if (uid !== myId) count++;
      const liked = myLikes.has(sid);
      if (liked) count++;
      map.set(sid, { count, liked });
    }
    return map;
  }, [fieldEntries, field.likesBySeal, mirror?.likes]);

  // Phase machine
  const [phase, setPhase] = useState<Phase>('field');
  const [activeSeal, setActiveSeal] = useState<Seal | null>(null);
  const [pressInProgress, setPressInProgress] = useState<{
    inscription: string;
    blindPress: boolean;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [detail, setDetail] = useState<{ seal: Seal; author?: DetailAuthor } | null>(null);

  // Demo URL hooks
  const demo = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('demo');
  }, []);
  useEffect(() => {
    if (!demo || !mirror) return;
    if (demo === 'press') setPhase('press-input');
    if (demo === 'altar') setPhase('altar');
  }, [demo, mirror]);

  // ─── Actions ──────────────────────────────────────────────────

  const handleOpenPress = () => {
    if (pressRemaining <= 0) {
      setShowQuotaModal(true);
      return;
    }
    setPhase('press-input');
  };

  const handleSubmitPress = async (inscriptionInput: string) => {
    if (!mirror) return;
    if (pressRemaining <= 0) {
      setShowQuotaModal(true);
      return;
    }

    const username = profile?.name ?? 'guest';
    const recentIcons = mirror.seals.slice(0, 6).map(s => s.iconKey);

    const oracle = consultOracle(
      inscriptionInput,
      username,
      mirror.seals.length,
      recentIcons,
    );

    setPressInProgress({
      inscription: oracle.inscription,
      blindPress: oracle.blindPress,
    });
    setError('');
    setPhase('pressing');

    try {
      const result = await sealGen.generate({
        monogram: mirror.monogram,
        iconKey: oracle.iconKey,
        inscription: oracle.inscription,
      });
      await preloadImage(result.imageUrl);

      const seal: Seal = {
        id: newId(),
        date: today,
        ts: Date.now(),
        monogram: mirror.monogram,
        iconKey: oracle.iconKey,
        silhouetteKey: result.silhouetteKey,
        materialKey: result.materialKey,
        damageKey: result.damageKey,
        inscription: oracle.inscription,
        blindPress: oracle.blindPress,
        imageUrl: result.imageUrl,
        destination: 'kept',
      };
      setActiveSeal(seal);
      setPhase('reveal');
    } catch {
      setError('The kiln went cold. Try again — no press was used.');
      setPhase('press-input');
    }
  };

  // One ritual action: pressing seals it into the public Field and keeps a
  // copy in your Altar. No private/public fork — every seal is public.
  const handleSeal = () => {
    if (!mirror || !activeSeal) return;
    const finalSeal: Seal = { ...activeSeal, destination: 'buried' };
    const nextUsed = mirror.pressDay === today ? mirror.pressUsedToday + 1 : 1;
    const nextSave: SealSave = {
      ...mirror,
      pressDay: today,
      pressUsedToday: nextUsed,
      seals: [finalSeal, ...mirror.seals],
    };
    setMirror(nextSave);
    persist(nextSave);

    events.trigger(`buried:${finalSeal.iconKey}`);
    events.trigger('buried');
    // Reconcile other users' new seals shortly (own seal already shows via
    // the mirror-derived merge in fieldEntries).
    setTimeout(() => field.refresh(), 1500);

    setActiveSeal(null);
    setPhase('field');
  };

  const handleDeleteSeal = (sealId: string) => {
    if (!mirror) return;
    const nextSave: SealSave = {
      ...mirror,
      seals: mirror.seals.filter(s => s.id !== sealId),
    };
    setMirror(nextSave);
    persist(nextSave);
    setDetail(null);
    // The seal lives in your own save, which also feeds the Field — drop it
    // and refresh the public feed.
    field.removeLocal(sealId);
    setTimeout(() => field.refresh(), 1500);
  };

  const handleToggleLike = (sealId: string) => {
    if (!mirror) return;
    const current = mirror.likes ?? [];
    const liked = current.includes(sealId);
    const nextLikes = liked
      ? current.filter(id => id !== sealId)
      : [...current, sealId];
    const nextSave: SealSave = { ...mirror, likes: nextLikes };
    setMirror(nextSave);
    persist(nextSave);
    if (!liked) {
      // Attach a platform notify action to the like event when liking
      // someone else's seal. Same record/play call handles both the
      // count and the fan-out notification.
      const entry = fieldEntries.find(e => e.seal.id === sealId);
      const selfId = telegramId || 'self';
      const isOther = !!entry && !!entry.userId && entry.userId !== selfId;
      const config = (isOther && entry.seal.imageUrl)
        ? {
            actions: [
              {
                type: 'notify',
                target_user_id: entry.userId,
                image: {
                  ref_url: entry.seal.imageUrl,
                  prompt: 'sealed clay disc, AlterU Press archive',
                },
                message: {
                  template: '{sender_name} kept your seal.',
                  variables: ['sender_name'],
                },
              },
            ],
          }
        : undefined;
      events.trigger(`like:${sealId}`, config);
    }
    // Reconcile other users' likes shortly; own like already shows locally.
    setTimeout(() => field.refresh(), 1500);
  };

  // Leave a public note on a seal: store it in my OWN blob (the Field
  // guestbook aggregates everyone's) and ping the author once — never self
  // or a seal I've already pinged this session.
  const msgNotified = useRef<Set<string>>(new Set());
  const handleSendNote = (sealId: string, authorId: string | undefined, imageUrl: string, text: string) => {
    if (!mirror) return;
    const msg = newMessage(sealId, authorId, text);
    if (!msg) return;
    const nextSave = appendMessage(mirror, msg);
    setMirror(nextSave);
    persist(nextSave);

    const selfId = telegramId || 'self';
    if (authorId && authorId !== selfId && !msgNotified.current.has(sealId)) {
      msgNotified.current.add(sealId);
      events.trigger(
        `seal_note:${sealId}`,
        guestbookNotifyConfig({
          toUserId: authorId,
          refUrl: imageUrl,
          note: text,
          template: '{sender_name} left a note on your seal.',
          imagePrompt: 'sealed clay disc, AlterU Press archive',
        }),
      );
    }
    setTimeout(() => field.refresh(), 1500);
  };

  const handleTab = (t: Tab) => {
    setPhase(t === 'field' ? 'field' : 'altar');
  };

  // Render
  if (!mirror) {
    return (
      <div className="tsp-root">
        <div className="tsp-boot">opening the press…</div>
      </div>
    );
  }

  const todayDateLine = today.split('-').slice(1).join(' · ');

  return (
    <div className="tsp-root">
      <TopBar rightLabel={todayDateLine} />

      <div className="tsp-page">
        {phase === 'field' && (
          <Field
            entries={fieldEntries}
            loaded={field.loaded}
            likeInfo={likeInfo}
            onToggleLike={handleToggleLike}
            selfUserId={telegramId || undefined}
            onOpen={(entry) => setDetail({
              seal: entry.seal,
              author: {
                userId: entry.userId,
                userName: entry.userName,
                userAvatarUrl: entry.userAvatarUrl,
                isSelf: entry.userId === (telegramId || undefined),
              },
            })}
          />
        )}
        {phase === 'press-input' && (
          <>
            {error && <div className="tsp-toast">{error}</div>}
            <PressInput
              monogram={mirror.monogram}
              onPress={handleSubmitPress}
              onCancel={() => setPhase('field')}
            />
          </>
        )}
        {phase === 'pressing' && pressInProgress && (
          <Pressing
            inscription={pressInProgress.inscription}
            blindPress={pressInProgress.blindPress}
          />
        )}
        {phase === 'reveal' && activeSeal && (
          <Reveal seal={activeSeal} onSeal={handleSeal} />
        )}
        {phase === 'altar' && (
          <Altar
            seals={mirror.seals}
            onOpen={(seal) => setDetail({ seal })}
          />
        )}
      </div>

      {(phase === 'field' || phase === 'altar') && (
        <TabBar
          active={phase === 'field' ? 'field' : 'altar'}
          pressRemaining={pressRemaining}
          pressMax={MAX_PRESS_PER_DAY}
          onTab={handleTab}
          onPress={handleOpenPress}
        />
      )}

      {showQuotaModal && (
        <QuotaModal onClose={() => setShowQuotaModal(false)} />
      )}

      {detail && (
        <SealDetail
          seal={detail.seal}
          author={detail.author}
          like={likeInfo.get(detail.seal.id) ?? { count: 0, liked: false }}
          thread={threadFor(
            detail.seal.id,
            field.messagesBySeal,
            mirror.messages,
            telegramId ?? undefined,
          )}
          selfUserId={telegramId || undefined}
          onToggleLike={() => handleToggleLike(detail.seal.id)}
          onSendNote={(text) =>
            handleSendNote(detail.seal.id, detail.author?.userId, detail.seal.imageUrl, text)
          }
          onClose={() => setDetail(null)}
          onDelete={handleDeleteSeal}
        />
      )}

      <Watermark />
    </div>
  );
}

function deriveDefaultMonogram(name?: string | null): string {
  if (!name) return '?';
  const letters = name.match(/[A-Za-z]/);
  return letters ? letters[0].toUpperCase() : '?';
}

function QuotaModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="tsp-modal" onClick={onClose}>
      <div className="tsp-modal__card" onClick={e => e.stopPropagation()}>
        <div className="tsp-modal__eyebrow">DAILY QUOTA</div>
        <h3 className="tsp-modal__title">You've pressed three today.</h3>
        <p className="tsp-modal__body">
          The press cools at midnight. Three new seals tomorrow — in
          <strong> {formatCountdown(msUntilMidnight())}</strong>.
        </p>
        <button className="tsp-modal__cta" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
