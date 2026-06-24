import type { GuestMessage } from '@shared/social/guestbook';

export type DayKey = string; // YYYY-MM-DD

export type Phase =
  | 'field'        // landing tab
  | 'press-input'  // single-screen text input (optional) + PRESS / blind option
  | 'pressing'     // gen-image in flight (kiln-fire placeholder)
  | 'reveal'       // result + cast destination choices
  | 'altar'        // personal collection tab
  ;

export type CastDestination = 'kept' | 'buried' | 'sent';

/** Persisted seal record — your own press OR one received from a friend. */
export interface Seal {
  id: string;                  // local UUID
  date: DayKey;
  ts: number;                  // ms epoch
  monogram: string;            // single capital letter
  iconKey: string;             // key from data/icons.ts
  silhouetteKey: string;       // key from data/silhouettes.ts
  materialKey: string;         // key from data/materials.ts
  damageKey: string;           // key from data/damage.ts
  inscription: string;         // user-typed or LLM-generated
  blindPress: boolean;         // true if no inscription typed (LLM filled)
  imageUrl: string;            // gen-image result
  destination: CastDestination;
  // For received seals: original author info
  fromUserId?: string;
  fromUserName?: string;
}

export interface SealSave {
  /** Per-day press count cap. NEVER OR with platform stats (daily-lock-trap). */
  pressDay?: DayKey;
  pressUsedToday: number;
  /** All seals you've pressed (any destination) + received. Newest first. */
  seals: Seal[];
  /** Seal ids (any author) this user has liked. Aggregated cross-user to
   *  build public like counts via the same get/data/list projection. */
  likes?: string[];
  /** Your monogram letter — default = first letter of platform name, editable later */
  monogram: string;
  /** Whether the first-time onboarding has been dismissed */
  onboarded: boolean;
  /** Public guestbook notes this user has left on seals (any author). Stored
   *  in this user's own blob; the Field aggregates everyone's via
   *  messagesByTarget. See @shared/social. */
  messages?: GuestMessage[];
}

export const MAX_PRESS_PER_DAY = 3;
