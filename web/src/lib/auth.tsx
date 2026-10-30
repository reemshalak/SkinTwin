"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useStore, type SyncedState } from "./store";
import { supabase } from "./supabase";

// Profile data lives in the account's user metadata (no database tables needed).
// Photos are stripped before syncing: they never leave the device.
const KEY = "skintwin";

interface Auth {
  enabled: boolean;
  ready: boolean;
  user: User | null;
  name?: string;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateName: (name: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
}

const Ctx = createContext<Auth | null>(null);

// Marks that this device's data belongs to an account (not a guest), so it can be
// cleared whenever nobody is signed in.
const OWNER = "skintwin:owner";
const mark = (id: string | null) => {
  try {
    if (id) localStorage.setItem(OWNER, id);
    else localStorage.removeItem(OWNER);
  } catch {}
};
const owner = () => {
  try {
    return localStorage.getItem(OWNER);
  } catch {
    return null;
  }
};

function syncedFrom(s: SyncedState): SyncedState {
  return {
    scans: s.scans.map(({ photo, ...rest }) => (photo?.startsWith("/") ? { ...rest, photo } : rest)),
    routine: s.routine,
    reminders: s.reminders,
    savedTwins: s.savedTwins,
    savedProducts: s.savedProducts,
    reminderTimes: s.reminderTimes,
    identity: s.identity,
    done: s.done,
    liveScans: s.liveScans,
    shelf: s.shelf,
    goal: s.goal,
    wellness: s.wellness,
    readNotes: s.readNotes,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabase);
  const pulled = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  // Signed out (here, in another tab, or the session expired): an account's data
  // must not stay on screen. Guest data, with no owner, is left alone.
  const { reset } = store;
  useEffect(() => {
    if (!ready || !store.ready || user) return;
    // One-time clean-up for data saved before devices were marked: a named
    // profile with nobody signed in came from an account.
    let legacy = false;
    try {
      legacy = !localStorage.getItem("skintwin:owner-checked") && Boolean(store.identity.displayName) && store.scans.length > 0;
      localStorage.setItem("skintwin:owner-checked", "1");
    } catch {}
    if (!owner() && !legacy) return;
    mark(null);
    reset();
  }, [ready, store.ready, user, reset, store.identity.displayName, store.scans.length]);

  // On sign-in: load the saved profile, or save this device's guest results to it.
  useEffect(() => {
    if (!supabase || !user || !store.ready || pulled.current === user.id) return;
    pulled.current = user.id;
    mark(user.id);
    try {
      localStorage.setItem("skintwin:owner-checked", "1");
    } catch {}
    const remote = user.user_metadata?.[KEY] as SyncedState | undefined;
    const local = syncedFrom(store);
    if (remote?.scans?.length && !store.scans.length) {
      store.hydrate(remote);
    } else if (store.scans.length) {
      supabase.auth.updateUser({ data: { [KEY]: local } });
    }
  }, [user, store]);

  // Keep the account up to date as the profile changes (debounced).
  const snapshot = JSON.stringify(syncedFrom(store));
  useEffect(() => {
    if (!supabase || !user || pulled.current !== user.id) return;
    const id = setTimeout(() => supabase!.auth.updateUser({ data: { [KEY]: JSON.parse(snapshot) } }), 1200);
    return () => clearTimeout(id);
  }, [snapshot, user]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!supabase) return { error: "Accounts aren't set up on this site yet." };
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) return { error: error.message };
    return { needsConfirm: !data.session };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Accounts aren't set up on this site yet." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  // Your results are saved to the account, so signing out clears this device
  // and goes back to the public homepage, even if the sign-out request fails.
  const signOut = useCallback(async () => {
    // Local sign-out needs no network, so it can't hang; then always go home.
    try {
      await Promise.race([supabase?.auth.signOut({ scope: "local" }), new Promise((r) => setTimeout(r, 1500))]);
    } catch {}
    pulled.current = null;
    mark(null);
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("sb-")).forEach((k) => localStorage.removeItem(k));
    } catch {}
    reset();
    window.location.replace("/");
  }, [reset]);

  const updateName = useCallback(async (name: string) => {
    if (!supabase) return { error: "Not signed in." };
    const { data, error } = await supabase.auth.updateUser({ data: { name } });
    if (data.user) setUser(data.user);
    return error ? { error: error.message } : {};
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) return { error: "Not signed in." };
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { error: error.message } : {};
  }, []);

  const value = useMemo<Auth>(
    () => ({ enabled: Boolean(supabase), ready, user, name: user?.user_metadata?.name, signUp, signIn, signOut, updateName, updatePassword }),
    [ready, user, signUp, signIn, signOut, updateName, updatePassword],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
