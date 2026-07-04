"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Suscripción Realtime a una partida: dispara onChange ante cualquier cambio
 * en matches o match_moves de ese match (RLS decide qué filas ve cada uno).
 * Incluye poll de respaldo por si un evento se pierde.
 */
export function useMatchChannel(matchId: string, onChange: () => void, pollMs = 8000) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_moves", filter: `match_id=eq.${matchId}` },
        () => onChangeRef.current(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        () => onChangeRef.current(),
      )
      .subscribe();

    const poll = setInterval(() => onChangeRef.current(), pollMs);
    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [matchId, pollMs]);
}
