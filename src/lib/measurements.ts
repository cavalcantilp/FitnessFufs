import type { MeasurementEntry, MeasurementKey } from './types'

export const MEASUREMENT_KEYS: MeasurementKey[] = ['waist', 'hips', 'chest']

export const MEASUREMENT_UNIT = 'cm'

/** Points d'une mesure donnée, triés par date croissante : les entrées sans cette clé sont ignorées. */
export function seriesFor(entries: MeasurementEntry[], key: MeasurementKey): { date: string; value: number }[] {
  return entries
    .filter((entry) => entry.values[key] !== undefined)
    .map((entry) => ({ date: entry.date, value: entry.values[key] as number }))
}
