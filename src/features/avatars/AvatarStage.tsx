import Image from "next/image";
import { PlayerAvatar } from "./PlayerAvatar";

/**
 * Avatar 2D parado sobre la plataforma neón (jahuga-stage-wide-transparent.png).
 * La plataforma (w-full, in-flow) ancla el alto; el avatar se para con los pies
 * sobre la superficie del óvalo. El padre solo fija el ancho.
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
      {/* Glow ambiental detrás del cuerpo */}
      <div className="pointer-events-none absolute inset-x-[22%] bottom-[42%] top-[2%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(61,109,255,0.32),transparent_70%)]" />

      {/* Plataforma: define el alto del contenedor */}
      <Image
        src="/assets/jahuga-stage-wide-transparent.png"
        alt=""
        width={1700}
        height={950}
        priority
        className="pointer-events-none block h-auto w-full select-none"
      />

      {/* Avatar: pies apoyados sobre el centro del óvalo (~46% desde abajo) */}
      <PlayerAvatar
        photoUrl={photoUrl}
        pose="idle"
        skinId={skinId}
        className="absolute bottom-[44%] left-1/2 h-[105%] w-auto -translate-x-1/2 drop-shadow-[0_18px_26px_rgba(0,0,0,0.55)]"
      />
    </div>
  );
}
