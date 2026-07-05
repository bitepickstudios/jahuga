import Image from "next/image";
import { PlayerAvatar } from "./PlayerAvatar";

/**
 * Avatar 2D parado sobre la plataforma neón (jahuga-stage-wide-transparent.png).
 * La plataforma (w-full, in-flow) ancla el alto; el avatar se para con los pies
 * sobre la superficie del óvalo. `name` (opcional) va encima de la cabeza.
 */
export function AvatarStage({
  photoUrl,
  skinId,
  name,
  className = "",
}: {
  photoUrl: string | null;
  skinId?: string;
  name?: string;
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

      {/* Avatar: pies apoyados sobre el centro del óvalo (~44% desde abajo) */}
      <PlayerAvatar
        photoUrl={photoUrl}
        pose="idle"
        skinId={skinId}
        className="absolute bottom-[44%] left-1/2 h-[105%] w-auto -translate-x-1/2 drop-shadow-[0_18px_26px_rgba(0,0,0,0.55)]"
      />

      {/* Nickname encima de la cabeza */}
      {name && (
        <p className="absolute bottom-[152%] left-1/2 -translate-x-1/2 whitespace-nowrap font-ui text-lg font-bold text-ice/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {name}
        </p>
      )}
    </div>
  );
}
