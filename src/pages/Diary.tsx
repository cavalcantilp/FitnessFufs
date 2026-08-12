import { useMemo, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { Ring } from '../components/Ring'
import { MacroBars } from '../components/MacroBars'
import { MicroPanel } from '../components/MicroPanel'
import { DayMacroPanel } from '../components/DayMacroPanel'
import { DayNoteSheet } from '../components/DayNoteSheet'
import {
  IconChevronLeft,
  IconChevronRight,
  IconComment,
  IconCopy,
  IconPlus,
  IconTrash,
} from '../components/icons'
import { formatDay, shiftDay, todayKey } from '../lib/date'
import { microsFor, sumMicros, sumNutrients } from '../lib/nutrition'
import { MEALS } from '../lib/meals'
import { foodName } from '../lib/foods'
import type { MealId } from '../lib/types'

interface DiaryProps {
  date: string
  onDateChange: (date: string) => void
  onAddTo: (meal: MealId) => void
  onToast: (message: string) => void
}

export function Diary({ date, onDateChange, onAddTo, onToast }: DiaryProps) {
  const { t, lang, entriesFor, removeEntry, targetsFor, copyDay, foods, notes } = useApp()
  const [noteOpen, setNoteOpen] = useState(false)

  // Les objectifs du jour consulté, pas ceux du profil : la journée peut avoir
  // sa propre répartition.
  const targets = targetsFor(date)

  const today = todayKey()
  const dayEntries = entriesFor(date)
  const eaten = useMemo(
    () => sumNutrients(dayEntries.map((entry) => entry.nutrients)),
    [dayEntries],
  )

  const byMeal = useMemo(() => {
    const groups = new Map<MealId, typeof dayEntries>()
    MEALS.forEach((meal) => groups.set(meal, []))
    dayEntries.forEach((entry) => groups.get(entry.meal)?.push(entry))
    return groups
  }, [dayEntries])

  /** Le libellé suit la langue courante tant que l'aliment existe encore. */
  const labelOf = (foodId: string, fallback: string) => {
    const food = foods.find((item) => item.id === foodId)
    return food ? foodName(food, lang) : fallback
  }

  const remaining = targets.kcal - eaten.kcal

  /**
   * Totaux de micronutriments du jour, et part des calories provenant
   * d'aliments renseignés : sans ce repère, un total partiel se lirait comme
   * un total complet.
   */
  const { dayMicros, microCoverage } = useMemo(() => {
    let covered = 0
    const perEntry = dayEntries.map((entry) => {
      const item = foods.find((candidate) => candidate.id === entry.foodId)
      const scaled = item ? microsFor(item, entry.grams) : null
      if (scaled) covered += entry.nutrients.kcal
      return scaled
    })
    return {
      dayMicros: perEntry.some(Boolean) ? sumMicros(perEntry) : null,
      microCoverage: eaten.kcal > 0 ? Math.round((covered / eaten.kcal) * 100) : 100,
    }
  }, [dayEntries, foods, eaten.kcal])

  const handleCopy = () => {
    const copied = copyDay(shiftDay(date, -1), date)
    onToast(copied > 0 ? t('diary.copied') : t('diary.nothingToCopy'))
  }

  /**
   * Balayage à deux doigts pour changer de jour. Le journal défile
   * verticalement en continu, contrairement à la grille du calendrier : un
   * balayage à un doigt y entrerait sans cesse en conflit avec le défilement
   * de la page, d'où le second doigt qui désambiguïse le geste.
   */
  const swipe = useRef<{ id: number; x: number; y: number }[] | null>(null)
  const onTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length !== 2) {
      swipe.current = null
      return
    }
    swipe.current = Array.from(event.touches).map((touch) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    }))
  }
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const lifted = Array.from(event.changedTouches).find((touch) =>
      start.some((entry) => entry.id === touch.identifier),
    )
    const origin = lifted && start.find((entry) => entry.id === lifted.identifier)
    if (!lifted || !origin) return
    const dx = lifted.clientX - origin.x
    const dy = lifted.clientY - origin.y
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    onDateChange(shiftDay(date, dx < 0 ? 1 : -1))
  }

  return (
    <div className="screen" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="day-nav">
        <button
          type="button"
          className="arrow"
          onClick={() => onDateChange(shiftDay(date, -1))}
          aria-label={t('diary.prevDay')}
        >
          <IconChevronLeft />
        </button>
        <div className="day-nav-center">
          <div className="label-with-note">
            <span className="label">{formatDay(date, lang)}</span>
            {/* La note se consulte et se modifie ici plutôt que depuis le calendrier :
                un simple toucher de jour n'y déplace que le contour, sans jamais
                ouvrir de clavier par surprise. */}
            <button
              type="button"
              className={`icon-btn note${notes[date] ? ' on' : ''}`}
              onClick={() => setNoteOpen(true)}
              aria-label={t('day.noteTitle')}
            >
              <IconComment size={15} />
            </button>
          </div>
          {date === today ? (
            <span className="today-hint">{t('diary.today')}</span>
          ) : (
            // Un jour éloigné se feuillette mal une flèche à la fois : ce
            // bouton revient directement à aujourd'hui.
            <button type="button" className="today-jump" onClick={() => onDateChange(today)}>
              {t('diary.backToToday')}
            </button>
          )}
          {notes[date] ? (
            <button type="button" className="day-note-preview" onClick={() => setNoteOpen(true)}>
              {notes[date]}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="arrow"
          onClick={() => onDateChange(shiftDay(date, 1))}
          aria-label={t('diary.nextDay')}
        >
          <IconChevronRight />
        </button>
      </div>

      <div className="card">
        <div className="summary">
          <Ring
            value={eaten.kcal}
            goal={targets.kcal}
            caption={remaining >= 0 ? t('diary.remaining') : t('diary.over')}
          />
          <div className="figures">
            <div className="figure-row">
              <span className="name">{t('diary.goal')}</span>
              <span className="value">{targets.kcal} kcal</span>
            </div>
            <div className="figure-row">
              <span className="name">{t('diary.eaten')}</span>
              <span className="value">{eaten.kcal} kcal</span>
            </div>
            <div className="figure-row">
              <span className="name">
                {remaining >= 0 ? t('diary.remaining') : t('diary.over')}
              </span>
              <span className={`value${remaining < 0 ? ' over' : ''}`}>
                {Math.abs(remaining)} kcal
              </span>
            </div>
          </div>
        </div>
        <MacroBars eaten={eaten} targets={targets} />
        {/* Remonté à chaque jour : l'ouverture dépend de la journée affichée. */}
        <DayMacroPanel key={date} date={date} targets={targets} />
        <MicroPanel micros={dayMicros} coverage={microCoverage} />
      </div>

      {MEALS.map((meal) => {
        const items = byMeal.get(meal) ?? []
        const total = sumNutrients(items.map((entry) => entry.nutrients))
        return (
          <section className="meal" key={meal}>
            <header className="meal-head">
              <span className="name">{t(`meal.${meal}`)}</span>
              <span className="kcal">{total.kcal} kcal</span>
            </header>

            {items.length === 0 ? (
              <p className="empty">{t('diary.emptyMeal')}</p>
            ) : (
              items.map((entry) => (
                <div className="entry" key={entry.id}>
                  <div className="info">
                    <div className="name">{labelOf(entry.foodId, entry.label)}</div>
                    <div className="detail">
                      {entry.grams} g
                      {entry.state ? ` ${t(entry.state === 'raw' ? 'state.raw' : 'state.cooked')}` : ''}{' '}
                      · {t('macro.protein.short')} {entry.nutrients.protein} ·{' '}
                      {t('macro.carbs.short')} {entry.nutrients.carbs} · {t('macro.fat.short')}{' '}
                      {entry.nutrients.fat}
                    </div>
                  </div>
                  <span className="kcal">{entry.nutrients.kcal}</span>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => removeEntry(entry.id)}
                    aria-label={t('common.delete')}
                  >
                    <IconTrash />
                  </button>
                </div>
              ))
            )}

            <button type="button" className="meal-add" onClick={() => onAddTo(meal)}>
              <IconPlus size={16} />
              {t('diary.addFood')}
            </button>
          </section>
        )
      })}

      <button type="button" className="btn secondary" onClick={handleCopy}>
        <IconCopy />
        {t('diary.copyPrev')}
      </button>

      {noteOpen ? <DayNoteSheet date={date} onClose={() => setNoteOpen(false)} /> : null}
    </div>
  )
}
