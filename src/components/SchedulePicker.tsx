import { useMemo, useState } from 'react'
import { FormPage } from './FormPage'
import { IconChevronLeft, IconChevronRight } from './icons'
import { useApp } from '../state/AppContext'
import { fromKey, localeOf, toKey, todayKey } from '../lib/date'
import { defaultMeal, mealLabel } from '../lib/meals'
import type { MealId } from '../lib/types'

interface SchedulePickerProps {
  onPick: (date: string, meal: MealId) => void
  onClose: () => void
  /** Deviné depuis le résumé du repas suggéré, quand possible — à défaut, l'heure actuelle. */
  initialMeal?: MealId
}

/** Lundi en tête, comme le calendrier principal. */
function startOfGrid(year: number, month: number): Date {
  const first = new Date(year, month, 1)
  const weekday = (first.getDay() + 6) % 7
  first.setDate(first.getDate() - weekday)
  return first
}

/**
 * Sélecteur de date minimal — un mois à la fois, un jour choisi d'un tap.
 * Contrairement au calendrier principal, aucun appui long : ici, choisir un
 * jour est la seule action possible, pas la première d'un enchaînement.
 */
export function SchedulePicker({ onPick, onClose, initialMeal }: SchedulePickerProps) {
  const { t, lang, mealDefs } = useApp()
  const today = todayKey()
  const [cursor, setCursor] = useState(() => {
    const current = fromKey(today)
    return { year: current.getFullYear(), month: current.getMonth() }
  })
  // Le jour choisi peut n'avoir aucun rapport avec l'heure actuelle : contrairement à
  // l'ajout du jour même, impossible de deviner le repas visé depuis l'heure de saisie —
  // initialMeal (déduit du résumé du repas suggéré) prime, l'heure n'est qu'un dernier recours.
  const [meal, setMeal] = useState<MealId>(() => initialMeal ?? defaultMeal())

  const { days, weeks } = useMemo(() => {
    const start = startOfGrid(cursor.year, cursor.month)
    const lead = Math.round((new Date(cursor.year, cursor.month, 1).getTime() - start.getTime()) / 86400000)
    const length = Math.ceil((lead + new Date(cursor.year, cursor.month + 1, 0).getDate()) / 7)
    return {
      weeks: length,
      days: Array.from({ length: length * 7 }, (_, index) => {
        const day = new Date(start)
        day.setDate(start.getDate() + index)
        return day
      }),
    }
  }, [cursor])

  const locale = localeOf(lang)
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })

  const weekdays = useMemo(() => {
    const reference = startOfGrid(2024, 0)
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(reference)
      day.setDate(reference.getDate() + index)
      return day.toLocaleDateString(locale, { weekday: 'narrow' })
    })
  }, [locale])

  const shiftMonth = (delta: number) => {
    setCursor((current) => {
      const moved = new Date(current.year, current.month + delta, 1)
      return { year: moved.getFullYear(), month: moved.getMonth() }
    })
  }

  return (
    <FormPage title={t('chat.pickDate')} onBack={onClose}>
      <div className="field">
        <label htmlFor="schedule-meal">{t('add.meal')}</label>
        <select id="schedule-meal" value={meal} onChange={(event) => setMeal(event.target.value)}>
          {mealDefs.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {mealLabel(entry, t)}
            </option>
          ))}
        </select>
      </div>

      <div className="day-nav">
        <button type="button" className="arrow" onClick={() => shiftMonth(-1)} aria-label={monthLabel}>
          <IconChevronLeft />
        </button>
        <div className="label" style={{ textTransform: 'capitalize' }}>
          {monthLabel}
        </div>
        <button type="button" className="arrow" onClick={() => shiftMonth(1)} aria-label={monthLabel}>
          <IconChevronRight />
        </button>
      </div>

      <div className="calendar-weekdays">
        {weekdays.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>

      <div className="calendar-grid" style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}>
        {days.map((day) => {
          const key = toKey(day)
          const classes = [
            'calendar-day',
            day.getMonth() !== cursor.month ? 'outside' : '',
            key === today ? 'today' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button type="button" className={classes} key={key} onClick={() => onPick(key, meal)}>
              <span className="day-top">
                <span className="num">{day.getDate()}</span>
              </span>
            </button>
          )
        })}
      </div>
    </FormPage>
  )
}
