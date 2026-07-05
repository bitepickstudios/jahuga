import { useId } from "react";

export type AvatarPose = "idle" | "kick" | "save";

/**
 * Avatar 2D de plataforma (docs/arquitectura.md): foto del usuario compuesta
 * sobre cuerpo ilustrado estilo sticker. Los minijuegos consumen este componente;
 * cuando llegue el 3D, acá se decide capa 2D vs GLB sin tocar los juegos.
 */
export function PlayerAvatar({
  photoUrl,
  pose = "idle",
  className = "",
}: {
  photoUrl: string | null;
  pose?: AvatarPose;
  className?: string;
}) {
  const clipId = useId();
  const jersey = "#e0322c"; // skin default: camiseta albirroja (intencional, no es token de UI)
  const stripe = "#efede6";
  const skin = "#e8b08a";
  const shorts = "#1c2431";

  return (
    <svg viewBox="0 0 200 260" className={className} role="img" aria-label="Avatar del jugador">
      <defs>
        <clipPath id={clipId}>
          <circle cx="100" cy="46" r="34" />
        </clipPath>
      </defs>

      {/* Cuerpo según pose */}
      {pose === "idle" && (
        <g>
          <rect x="66" y="84" width="68" height="76" rx="16" fill={jersey} />
          <rect x="88" y="84" width="10" height="76" fill={stripe} />
          <rect x="106" y="84" width="10" height="76" fill={stripe} />
          {/* brazos */}
          <rect x="48" y="90" width="16" height="58" rx="8" fill={jersey} />
          <rect x="136" y="90" width="16" height="58" rx="8" fill={jersey} />
          <circle cx="56" cy="152" r="8" fill={skin} />
          <circle cx="144" cy="152" r="8" fill={skin} />
          {/* shorts y piernas */}
          <rect x="70" y="156" width="60" height="30" rx="10" fill={shorts} />
          <rect x="76" y="184" width="18" height="52" rx="9" fill={skin} />
          <rect x="106" y="184" width="18" height="52" rx="9" fill={skin} />
          <rect x="72" y="230" width="26" height="14" rx="7" fill="#111" />
          <rect x="102" y="230" width="26" height="14" rx="7" fill="#111" />
        </g>
      )}

      {pose === "kick" && (
        <g>
          <rect x="60" y="84" width="68" height="74" rx="16" fill={jersey} transform="rotate(-8 94 121)" />
          <rect x="82" y="84" width="10" height="74" fill={stripe} transform="rotate(-8 94 121)" />
          <rect x="100" y="84" width="10" height="74" fill={stripe} transform="rotate(-8 94 121)" />
          {/* brazos abiertos para el equilibrio */}
          <rect x="34" y="86" width="16" height="56" rx="8" fill={jersey} transform="rotate(30 42 114)" />
          <rect x="140" y="86" width="16" height="56" rx="8" fill={jersey} transform="rotate(-40 148 114)" />
          {/* shorts */}
          <rect x="64" y="152" width="60" height="30" rx="10" fill={shorts} transform="rotate(-8 94 167)" />
          {/* pierna de apoyo */}
          <rect x="70" y="180" width="18" height="54" rx="9" fill={skin} />
          <rect x="66" y="228" width="26" height="14" rx="7" fill="#111" />
          {/* pierna pateadora extendida */}
          <rect x="104" y="168" width="56" height="18" rx="9" fill={skin} transform="rotate(24 104 177)" />
          <rect x="150" y="196" width="26" height="14" rx="7" fill="#111" transform="rotate(24 150 203)" />
          {/* pelota */}
          <circle cx="176" cy="226" r="14" fill={stripe} stroke="#111" strokeWidth="2" />
        </g>
      )}

      {pose === "save" && (
        <g>
          <rect x="66" y="88" width="68" height="72" rx="16" fill={jersey} />
          <rect x="88" y="88" width="10" height="72" fill={stripe} />
          <rect x="106" y="88" width="10" height="72" fill={stripe} />
          {/* brazos arriba, estirados */}
          <rect x="44" y="34" width="16" height="64" rx="8" fill={jersey} transform="rotate(18 52 66)" />
          <rect x="140" y="34" width="16" height="64" rx="8" fill={jersey} transform="rotate(-18 148 66)" />
          <circle cx="44" cy="34" r="9" fill={skin} />
          <circle cx="156" cy="34" r="9" fill={skin} />
          {/* shorts y piernas flexionadas */}
          <rect x="70" y="156" width="60" height="28" rx="10" fill={shorts} />
          <rect x="68" y="182" width="18" height="48" rx="9" fill={skin} transform="rotate(10 77 206)" />
          <rect x="114" y="182" width="18" height="48" rx="9" fill={skin} transform="rotate(-10 123 206)" />
          <rect x="58" y="224" width="26" height="14" rx="7" fill="#111" />
          <rect x="116" y="224" width="26" height="14" rx="7" fill="#111" />
        </g>
      )}

      {/* Cabeza: foto recortada o placeholder */}
      {photoUrl ? (
        <image
          href={photoUrl}
          x="66"
          y="12"
          width="68"
          height="68"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <g>
          <circle cx="100" cy="46" r="34" fill={skin} />
          <circle cx="88" cy="42" r="4" fill="#111" />
          <circle cx="112" cy="42" r="4" fill="#111" />
          <path d="M86 58 Q100 68 114 58" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
      <circle cx="100" cy="46" r="34" fill="none" stroke={stripe} strokeWidth="3" />
    </svg>
  );
}
