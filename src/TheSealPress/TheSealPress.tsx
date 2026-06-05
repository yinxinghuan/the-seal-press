import { useEffect, useMemo, useState } from 'react';
import { useGameSave } from '@shared/save';
import { useGameEvent } from '@shared/runtime';
import { telegramId } from '@shared/runtime/bridge';
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
import { useField } from './hooks/useField';
import { consultOracle } from './hooks/useOracle';
import { todayKey, formatCountdown, msUntilMidnight } from './utils/day';
import { preloadImage } from './utils/preload';
import { newId } from './utils/rng';
import type { Seal, SealSave, CastDestination, Phase } from './types';
import { MAX_PRESS_PER_DAY } from './types';
import './TheSealPress.less';

const GAME_ID = 'the-seal-press';

export default function TheSealPress() {
  const { savedData, persist } = useGameSave<SealSave>(GAME_ID);
  const profile = useSelfProfile();
  const sealGen = useSealGen();
  const field = useField();
  const events = useGameEvent();

  // Local mirror — useGameSave.savedData never updates after persist().
  const [mirror, setMirror] = useState<SealSave | undefined>(undefined);
  useEffect(() => {
    if (mirror === undefined && savedData !== undefined) {
      const initialMonogram =
        savedData?.monogram ?? deriveDefaultMonogram(profile?.name);
      setMirror({
        seals: savedData?.seals ?? [],
        pressDay: savedData?.pressDay,
        pressUsedToday: savedData?.pressUsedToday ?? 0,
        monogram: initialMonogram,
        onboarded: savedData?.onboarded ?? false,
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

  // Phase machine
  const [phase, setPhase] = useState<Phase>('field');
  const [activeSeal, setActiveSeal] = useState<Seal | null>(null);
  const [pressInProgress, setPressInProgress] = useState<{
    inscription: string;
    blindPress: boolean;
  } | null>(null);
  const [marked, setMarked] = useState<Set<string>>(new Set());
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

  const handleCast = (destination: CastDestination) => {
    if (!mirror || !activeSeal) return;
    const finalSeal: Seal = { ...activeSeal, destination };
    const nextUsed = mirror.pressDay === today ? mirror.pressUsedToday + 1 : 1;
    const nextSave: SealSave = {
      ...mirror,
      pressDay: today,
      pressUsedToday: nextUsed,
      seals: [finalSeal, ...mirror.seals],
    };
    setMirror(nextSave);
    persist(nextSave);

    if (destination === 'buried') {
      events.trigger(`buried:${finalSeal.iconKey}`);
      events.trigger('buried');
      // Show it in the Field instantly — the platform save → get/data/list
      // read is eventually-consistent, so a plain refresh races the write.
      field.injectLocal({
        userId: telegramId || 'self',
        userName: profile?.name,
        userAvatarUrl: profile?.avatarUrl,
        seal: finalSeal,
      });
      setTimeout(() => field.refresh(), 1500);
    }

    setActiveSeal(null);
    setPhase(destination === 'buried' ? 'field' : 'altar');
  };

  const handleDeleteSeal = (sealId: string) => {
    if (!mirror) return;
    const target = mirror.seals.find(s => s.id === sealId);
    const nextSave: SealSave = {
      ...mirror,
      seals: mirror.seals.filter(s => s.id !== sealId),
    };
    setMirror(nextSave);
    persist(nextSave);
    setDetail(null);
    // A buried seal lives in your own save, so deleting it also removes it
    // from the Field — drop any optimistic copy + refresh the public feed.
    if (target?.destination === 'buried') {
      field.removeLocal(sealId);
      setTimeout(() => field.refresh(), 1500);
    }
  };

  const handleMark = (sealId: string) => {
    if (marked.has(sealId)) return;
    setMarked(prev => {
      const next = new Set(prev);
      next.add(sealId);
      return next;
    });
    events.trigger(`mark:${sealId}`);
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
            entries={field.entries}
            loaded={field.loaded}
            marked={marked}
            onMark={handleMark}
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
          <Reveal seal={activeSeal} onCast={handleCast} />
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
        <button className="tsp-modal__cta" onPointerDown={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
