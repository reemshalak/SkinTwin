"use client";

import { useMemo } from "react";
import { useStore } from "./store";
import { featuredMatches, findTwins } from "./twins";

export function useTwins() {
  const { latest } = useStore();
  return useMemo(() => {
    if (!latest) return { twins: [], featured: [] };
    return {
      twins: findTwins(latest.scores, latest.sampleId),
      featured: featuredMatches(latest.scores, latest.sampleId),
    };
  }, [latest]);
}
