"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { fetchHelpful, sampleHelpful, setHelpful } from "./community";

// "Helpful" counts for a list of reviews: sample baseline plus real votes.
export function useEngagement(keys: string[]) {
  const { user } = useAuth();
  const [real, setReal] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const joined = keys.join("|");

  useEffect(() => {
    let live = true;
    fetchHelpful(joined ? joined.split("|") : []).then(({ counts, mine }) => {
      if (!live) return;
      setReal(counts);
      setMine(mine);
    });
    return () => {
      live = false;
    };
  }, [joined, user]);

  const get = useCallback(
    (key: string) => ({ count: (key.startsWith("sample:") ? sampleHelpful(key) : 0) + (real[key] ?? 0), mine: mine.has(key) }),
    [real, mine],
  );

  const toggle = useCallback(
    (key: string) => {
      if (!user) return false;
      const on = !mine.has(key);
      setMine((m) => {
        const n = new Set(m);
        if (on) n.add(key);
        else n.delete(key);
        return n;
      });
      setReal((r) => ({ ...r, [key]: Math.max(0, (r[key] ?? 0) + (on ? 1 : -1)) }));
      setHelpful(key, on);
      return true;
    },
    [user, mine],
  );

  return { get, toggle };
}
