/**
 * Valores de D2 (docs/decisiones-abiertas.md) — SOLO para mostrar en UI.
 * La aplicación real vive en las funciones de la migración 4 (un solo lugar
 * que muta saldos). Mantener en sync con supabase/migrations/*_economy.sql.
 */
export const ECONOMY = {
  welcomeBonus: 10_000,
  transferDailyLimit: 20_000,
  streakStep: 500,
  streakCap: 5_000,
  wagerPresets: [500, 1_000, 5_000],
} as const;

export function formatCoins(amount: number | bigint): string {
  return Number(amount).toLocaleString("es-PY");
}
