/** Tipos de dominio (espejo de docs/modelo-datos.md hasta tener tipos generados). */

export interface Profile {
  id: string;
  nickname: string;
  display_name: string | null;
  birth_date: string | null; // ISO date; la edad se deriva
  photo_url: string | null;
  is_public: boolean;
  iconic_phrases: string[];
  invite_code: string;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Avatar {
  profile_id: string;
  kind: "2d_layers" | "glb";
  photo_crop_url: string | null;
  glb_url: string | null;
  equipped: Record<string, string | null>;
}

export function ageFrom(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age--;
  return age;
}
