"use client";

import type { Direction } from "../engine";

const ZONES: Direction[] = ["left", "center", "right"];

/**
 * El arco ES el input: tocás la zona de la red donde pateás o te tirás.
 * Postes de cal, red dibujada con gradientes. Targets de ~1/3 del ancho, ≥ 44px.
 */
export function GoalPicker({
  selected,
  onSelect,
}: {
  selected: Direction | null;
  onSelect: (direction: Direction) => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Arco: travesaño y postes */}
      <div className="rounded-t-sm border-x-8 border-t-8 border-ice/90 bg-night/60">
        <div
          className="grid h-44 grid-cols-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 11px, rgba(239,237,230,0.14) 11px 12px)," +
              "repeating-linear-gradient(90deg, transparent 0 11px, rgba(239,237,230,0.14) 11px 12px)",
          }}
        >
          {ZONES.map((zone) => (
            <button
              key={zone}
              type="button"
              aria-label={
                zone === "left" ? "Palo izquierdo" : zone === "center" ? "Al centro" : "Palo derecho"
              }
              aria-pressed={selected === zone}
              onClick={() => onSelect(zone)}
              className={`transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-volt ${
                selected === zone
                  ? "bg-volt/25 shadow-[inset_0_0_0_3px_var(--color-volt)]"
                  : "active:bg-ice/20"
              }`}
            />
          ))}
        </div>
      </div>
      {/* Línea de cal del área */}
      <div className="h-2 w-full bg-ice/90" />
      <div className="mt-1 grid grid-cols-3 text-center text-xs uppercase tracking-widest text-ice/50">
        <span>Izquierda</span>
        <span>Centro</span>
        <span>Derecha</span>
      </div>
    </div>
  );
}
