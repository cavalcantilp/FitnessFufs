import { shiftMonth, todayKey } from './date'

/** Plafond de dépense estimée pour l'assistant sur une période, en dollars. */
export const MONTHLY_CAP_USD = 1

/**
 * Vrai si un mois complet s'est écoulé depuis le début de la période de suivi en
 * cours — la période démarre à la première dépense, pas au 1er du calendrier.
 */
export function usagePeriodExpired(since: string, today: string = todayKey()): boolean {
  return today >= shiftMonth(since, 1)
}
