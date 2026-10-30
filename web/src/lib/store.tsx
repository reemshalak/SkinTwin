"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { canonicalId } from "./products";
import type { ConcernKey, RoutineItem, SkinProfile } from "./types";

// Gentle daily habits that help skin: bedtime, a rest break, water, a weekly note.
export interface Wellness {
  sleep: { on: boolean; time: string }; // bedtime "HH:MM"
  rest: { on: boolean; time: string };
  water: { on: boolean; everyHours: number };
  journal: { on: boolean; day: number }; // 0 = Monday
}
export const DEFAULT_WELLNESS: Wellness = {
  sleep: { on: true, time: "22:30" },
  rest: { on: false, time: "15:00" },
  water: { on: false, everyHours: 2 },
  journal: { on: true, day: 6 },
};

// A before/after aim for one concern, tracked by check-ins.
export interface SkinGoal {
  concern: ConcernKey;
  from: number;
  target: number;
  by: string; // ISO date
  setAt: string;
}

interface State {
  scans: SkinProfile[]; // oldest first
  routine: RoutineItem[];
  reminders: boolean;
  savedTwins: string[];
  savedProducts: string[];
  reminderTimes: { am: string; pm: string }; // "HH:MM"
  // Public identity: what other people see. Never a scan photo.
  identity: { displayName: string; avatar?: string }; // avatar: small photo the user picked
  // Daily routine tick-offs, keyed "YYYY-MM-DD:am" -> product ids done.
  done: Record<string, string[]>;
  // Use live YouCam analysis for new scans (spends API units). Off = demo scores.
  liveScans: boolean;
  // Products you already own (from cart import or ticked by hand).
  shelf: string[];
  goal: SkinGoal | null;
  wellness: Wellness;
  readNotes: string[]; // notification ids already seen
}

// A scan waiting to run on the analysis screen. Memory only, never persisted.
export interface PendingScan {
  sampleId?: string;
  imageDataUrl?: string;
  photo: string;
  photoHash: string;
}

// What syncs to an account: everything except photos, which stay on the device.
export type SyncedState = State;

const EMPTY: State = {
  scans: [],
  routine: [],
  reminders: false,
  savedTwins: [],
  savedProducts: [],
  reminderTimes: { am: "08:00", pm: "21:00" },
  identity: { displayName: "" },
  done: {},
  liveScans: false,
  shelf: [],
  goal: null,
  wellness: DEFAULT_WELLNESS,
  readNotes: [],
};
const KEY = "skintwin:v1";

interface Store extends State {
  ready: boolean;
  latest?: SkinProfile;
  pending: PendingScan | null;
  setPending: (p: PendingScan | null) => void;
  toggleSavedTwin: (id: string) => void;
  toggleSavedProduct: (id: string) => void;
  setReminderTimes: (t: { am: string; pm: string }) => void;
  clearPhotos: () => void;
  deleteScan: (id: string) => void;
  updateScan: (id: string, patch: Partial<SkinProfile>) => void;
  setIdentity: (i: Partial<State["identity"]>) => void;
  toggleDone: (key: string, productId: string) => void;
  replaceRoutine: (items: RoutineItem[]) => void;
  setLiveScans: (on: boolean) => void;
  addToShelf: (ids: string[]) => void;
  toggleShelf: (id: string) => void;
  setGoal: (g: SkinGoal | null) => void;
  setWellness: (w: Partial<Wellness>) => void;
  markNotesRead: (ids: string[]) => void;
  hydrate: (s: Partial<SyncedState>) => void;
  addScan: (p: SkinProfile) => void;
  setScans: (s: SkinProfile[]) => void;
  addToRoutine: (productId: string, slot: "am" | "pm") => void;
  removeFromRoutine: (productId: string, slot: "am" | "pm") => void;
  setReminders: (on: boolean) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<PendingScan | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = { ...EMPTY, ...JSON.parse(raw) } as State;
        // Product ids from an earlier catalogue map onto the current one.
        saved.routine = saved.routine.map((r) => ({ ...r, productId: canonicalId(r.productId) }));
        saved.savedProducts = saved.savedProducts.map(canonicalId);
        saved.shelf = saved.shelf.map(canonicalId);
        saved.wellness = { ...DEFAULT_WELLNESS, ...(saved.wellness ?? {}) };
        saved.done = Object.fromEntries(Object.entries(saved.done).map(([k, ids]) => [k, ids.map(canonicalId)]));
        setState(saved);
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, ready]);

  const addScan = useCallback((p: SkinProfile) => setState((s) => ({ ...s, scans: [...s.scans, p] })), []);
  const setScans = useCallback((scans: SkinProfile[]) => setState((s) => ({ ...s, scans })), []);
  const addToRoutine = useCallback(
    (productId: string, slot: "am" | "pm") =>
      setState((s) =>
        s.routine.some((r) => r.productId === productId && r.slot === slot)
          ? s
          : { ...s, routine: [...s.routine, { productId, slot, addedAt: new Date().toISOString() }] },
      ),
    [],
  );
  const removeFromRoutine = useCallback(
    (productId: string, slot: "am" | "pm") =>
      setState((s) => ({ ...s, routine: s.routine.filter((r) => !(r.productId === productId && r.slot === slot)) })),
    [],
  );
  const setReminders = useCallback((reminders: boolean) => setState((s) => ({ ...s, reminders })), []);
  // Wipe saved data right away too, so a page change straight after can't bring it back.
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      Object.keys(sessionStorage).filter((k) => k.startsWith("skintwin:")).forEach((k) => sessionStorage.removeItem(k));
    } catch {}
    setState(EMPTY);
  }, []);
  const toggleSavedProduct = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        savedProducts: s.savedProducts.includes(id) ? s.savedProducts.filter((x) => x !== id) : [...s.savedProducts, id],
      })),
    [],
  );
  const setReminderTimes = useCallback((reminderTimes: { am: string; pm: string }) => setState((s) => ({ ...s, reminderTimes })), []);
  // Drop selfies from this device; sample portraits (public paths) are kept.
  const clearPhotos = useCallback(
    () => setState((s) => ({ ...s, scans: s.scans.map((p) => (p.photo?.startsWith("data:") ? { ...p, photo: undefined } : p)) })),
    [],
  );
  const deleteScan = useCallback((id: string) => setState((s) => ({ ...s, scans: s.scans.filter((p) => p.id !== id) })), []);
  const updateScan = useCallback(
    (id: string, patch: Partial<SkinProfile>) => setState((s) => ({ ...s, scans: s.scans.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
    [],
  );
  const setIdentity = useCallback((i: Partial<State["identity"]>) => setState((s) => ({ ...s, identity: { ...s.identity, ...i } })), []);
  const toggleDone = useCallback(
    (key: string, productId: string) =>
      setState((s) => {
        const cur = s.done[key] ?? [];
        const next = cur.includes(productId) ? cur.filter((x) => x !== productId) : [...cur, productId];
        return { ...s, done: { ...s.done, [key]: next } };
      }),
    [],
  );
  const setLiveScans = useCallback((liveScans: boolean) => setState((s) => ({ ...s, liveScans })), []);
  const addToShelf = useCallback((ids: string[]) => setState((s) => ({ ...s, shelf: Array.from(new Set([...s.shelf, ...ids])) })), []);
  const toggleShelf = useCallback(
    (id: string) => setState((s) => ({ ...s, shelf: s.shelf.includes(id) ? s.shelf.filter((x) => x !== id) : [...s.shelf, id] })),
    [],
  );
  const setWellness = useCallback((w: Partial<Wellness>) => setState((s) => ({ ...s, wellness: { ...s.wellness, ...w } })), []);
  const markNotesRead = useCallback(
    (ids: string[]) => setState((s) => ({ ...s, readNotes: Array.from(new Set([...s.readNotes, ...ids])).slice(-200) })),
    [],
  );
  const setGoal = useCallback((goal: SkinGoal | null) => setState((s) => ({ ...s, goal })), []);
  const replaceRoutine = useCallback((items: RoutineItem[]) => setState((s) => ({ ...s, routine: items })), []);
  const hydrate = useCallback((s: Partial<SyncedState>) => setState((cur) => ({ ...cur, ...s })), []);
  const toggleSavedTwin = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        savedTwins: s.savedTwins.includes(id) ? s.savedTwins.filter((x) => x !== id) : [...s.savedTwins, id],
      })),
    [],
  );

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready,
      latest: state.scans[state.scans.length - 1],
      pending,
      setPending,
      toggleSavedTwin,
      toggleSavedProduct,
      setReminderTimes,
      clearPhotos,
      deleteScan,
      updateScan,
      setIdentity,
      toggleDone,
      replaceRoutine,
      setLiveScans,
      addToShelf,
      toggleShelf,
      setGoal,
      setWellness,
      markNotesRead,
      hydrate,
      addScan,
      setScans,
      addToRoutine,
      removeFromRoutine,
      setReminders,
      reset,
    }),
    [state, ready, pending, toggleSavedTwin, toggleSavedProduct, setReminderTimes, clearPhotos, deleteScan, updateScan, setIdentity, toggleDone, replaceRoutine, setLiveScans, addToShelf, toggleShelf, setGoal, setWellness, markNotesRead, hydrate, addScan, setScans, addToRoutine, removeFromRoutine, setReminders, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside StoreProvider");
  return ctx;
}
