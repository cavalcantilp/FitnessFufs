import { useMemo } from 'react'
import { useApp } from '../state/AppContext'
import { Ring } from '../components/Ring'
import { MacroBars } from '../components/MacroBars'
import { MicroPanel } from '../components/MicroPanel'
import { IconChevronLeft, IconChevronRight, IconCopy, IconPlus, IconTrash } from '../components/icons'
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
  const { t, lang, entriesFor, removeEntry, targets, copyDay, foods } = useApp()

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

  return (
    <div className="screen">
      <div className="day-nav">
        <button
          type="button"
          className="arrow"
          onClick={() => onDateChange(shiftDay(date, -1))}
          aria-label={t('diary.copyPrev')}
        >
          <IconChevronLeft />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="label">{formatDay(date, lang)}</div>
          {date === today ? <span className="today-hint">{t('diary.today')}</span> : null}
        </div>
        <button
          type="button"
          className="arrow"
          onClick={() => onDateChange(shiftDay(date, 1))}
          disabled={date >= today}
          aria-label={t('diary.today')}
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
    </div>
  )
}
