"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// ponytail: overlay propio en vez del compound de 5 partes de HeroUI — dos modales
// mock, mismo look, control total del radius/backdrop. a11y básica: role=dialog,
// aria-modal, esc, click-backdrop, lock de scroll, foco inicial + restaurado.
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const maxW = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";

  // Portal a body: evita que un ancestro con backdrop-blur/transform (el header)
  // capture el `fixed` del overlay como containing block.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-night/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxW} rounded-t-3xl border border-ice/10 bg-navy shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none sm:rounded-3xl`}
      >
        <div className="flex items-center justify-between border-b border-ice/10 px-5 py-4">
          <h2 className="font-ui text-lg font-extrabold text-ice">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 items-center justify-center rounded-full text-ice/50 transition-colors hover:bg-ice/10 hover:text-ice"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
