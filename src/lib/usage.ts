/** Plafond mensuel de dépense estimée pour l'assistant, en dollars. */
export const MONTHLY_CAP_USD = 1

/** Clé du mois courant (« 2026-08 »), pour détecter le passage à un nouveau mois. */
export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
