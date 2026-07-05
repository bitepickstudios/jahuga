"use client";

import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import type { Direction, Kick, PenaltyResult, Save } from "../engine";

const ZONE_X: Record<Direction, number> = { left: -110, center: 0, right: 110 };

const RESULT_LABEL: Record<PenaltyResult, string> = {
  goal: "¡GOL!",
  saved: "¡ATAJADO!",
  missed: "¡AFUERA!",
};

const RESULT_COLOR: Record<PenaltyResult, string> = {
  goal: "text-ice drop-shadow-[0_0_18px_rgba(46,125,79,0.9)]",
  saved: "text-gold drop-shadow-[0_0_18px_rgba(232,185,59,0.6)]",
  missed: "text-danger drop-shadow-[0_0_18px_rgba(224,50,44,0.6)]",
};

/**
 * La revelación de un penal: pelota a la zona elegida, arquero que se tira,
 * y el veredicto en tipografía de cartel. El momento firma del juego.
 */
export function PenaltyReveal({
  kickerName,
  kick,
  save,
  result,
  onDone,
}: {
  kickerName: string;
  kick: Kick;
  save: Save;
  result: PenaltyResult;
  onDone: () => void;
}) {
  const ballX = result === "missed" ? ZONE_X[kick.direction] * 1.6 : ZONE_X[kick.direction];
  const ballY = result === "missed" ? -240 : -105;
  const keeperDelay = save.timing === "dive_early" ? 0 : 0.3;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="text-sm uppercase tracking-widest text-ice/60">Patea {kickerName}</p>

      <div className="relative mx-auto w-full max-w-sm">
        <div className="rounded-t-sm border-x-8 border-t-8 border-ice/90 bg-night/60">
          <div
            className="relative h-44 overflow-visible"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0 11px, rgba(239,237,230,0.14) 11px 12px)," +
                "repeating-linear-gradient(90deg, transparent 0 11px, rgba(239,237,230,0.14) 11px 12px)",
            }}
          >
            {/* Arquero */}
            <motion.div
              className="absolute left-1/2 top-1/2 -ml-5 -mt-5 text-4xl"
              initial={{ x: 0, rotate: 0 }}
              animate={{ x: ZONE_X[save.direction], rotate: save.direction === "left" ? -25 : save.direction === "right" ? 25 : 0 }}
              transition={{ duration: 0.35, delay: keeperDelay, ease: "easeOut" }}
            >
              🧤
            </motion.div>
            {/* Pelota */}
            <motion.div
              className="absolute bottom-0 left-1/2 -ml-4 text-3xl"
              initial={{ x: 0, y: 48, scale: 1 }}
              animate={{ x: ballX, y: ballY, scale: result === "missed" ? 0.5 : 0.85 }}
              transition={{ duration: 0.45, delay: 0.15, ease: "easeIn" }}
            >
              ⚽
            </motion.div>
            {/* Veredicto */}
            <motion.p
              className={`absolute inset-0 flex items-center justify-center font-display text-6xl ${RESULT_COLOR[result]}`}
              initial={{ opacity: 0, scale: 2.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 18 }}
            >
              {RESULT_LABEL[result]}
            </motion.p>
          </div>
        </div>
        <div className="h-2 w-full bg-ice/90" />
      </div>

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Button variant="secondary" size="lg" fullWidth onPress={onDone} className="min-h-11">
          Seguir
        </Button>
      </motion.div>
    </div>
  );
}
