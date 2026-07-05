import Image from "next/image";
import { PlayerAvatar } from "./PlayerAvatar";

/**
 * Avatar 2D parado sobre la plataforma neón (jahuga-stage-wide-transparent.png).
 * La plataforma (w-full) ancla el alto del contenedor; el avatar se posiciona
 * encima con % → escala igual en desktop y mobile. El padre solo fija el ancho.
 */
export function AvatarStage({
  photoUrl,
  skinId,
  className = "",
}: {
  photoUrl: string | null;
  skinId?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Glow ambiental */}
      <div className="pointer-events-none absolute inset-x-[10%] bottom-[10%] top-[-10%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(61,109,255,0.35),transparent_70%)]" />

      {/* Plataforma: define el alto del contenedor */}
      <Image
        src="/assets/jahuga-stage-wide-transparent.png"
        alt=""
        width={1700}
        height={950}
        priority
        className="pointer-events-none block h-auto w-full select-none"
      />

      {/* Avatar parado sobre el centro de la plataforma */}
      <PlayerAvatar
        photoUrl={photoUrl}
        pose="idle"
        skinId={skinId}
        className="absolute bottom-[12%] left-1/2 h-[135%] w-auto -translate-x-1/2 drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]"
      />
    </div>
  );
}
