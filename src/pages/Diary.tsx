import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
  IconEdit,
  IconGrip,
  IconPlus,
  IconTrash,
} from '../components/icons'
import { formatDay, shiftDay, todayKey } from '../lib/date'
import { microsFor, sumMicros, sumNutrients } from '../lib/nutrition'
import { DEFAULT_MEALS, MAX_CUSTOM_MEALS, mealLabel } from '../lib/meals'
import { foodName } from '../lib/foods'
import type { MealDef, MealId } from '../lib/types'

interface DiaryProps {
  date: string
  onDateChange: (date: string) => void
  onAddTo: (meal: MealId) => void
  onToast: (message: string) => void
}

/** Doigt immobile assez longtemps sur la poignée pour déclencher le glisser, pas juste un tap. */
const LONG_PRESS_MS = 350
/** Au-delà, un doigt qui bouge avant la fin du long-press est un scroll, pas une intention de glisser. */
const MOVE_CANCEL_PX = 10

export function Diary({ date, onDateChange, onAddTo, onToast }: DiaryProps) {
  const {
    t,
    lang,
    entriesFor,
    removeEntry,
    targetsFor,
    copyDay,
    foods,
    notes,
    mealDefs,
    addMeal,
    renameMeal,
    reorderMeals,
  } = useApp()
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
    mealDefs.forEach((meal) => groups.set(meal.id, []))
    dayEntries.forEach((entry) => groups.get(entry.meal)?.push(entry))
    return groups
  }, [dayEntries, mealDefs])

  /** Le libellé suit la langue courante tant que l'aliment existe encore. */
  const labelOf = (foodId: string, fallback: string) => {
    const food = foods.find((item) => item.id === foodId)
    return food ? foodName(food, lang) : fallback
  }

  const remaining = targets.kcal - eaten.kcal

  // --- Réorganisation des repas par glisser-déposer (appui long sur la poignée) ---
  const [order, setOrder] = useState<string[]>(() => mealDefs.map((meal) => meal.id))
  const orderRef = useRef(order)
  orderRef.current = order
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map())
  const dragInfo = useRef<{
    id: string
    pointerId: number
    pointerStartX: number
    pointerStartY: number
    naturalTop: number
    height: number
    longPressTimer: number | null
    active: boolean
  } | null>(null)

  useEffect(() => {
    // Ne pas resynchroniser pendant un glisser en cours : ça couperait l'ordre en vol.
    if (!dragInfo.current) setOrder(mealDefs.map((meal) => meal.id))
  }, [mealDefs])

  const orderedMeals = order
    .map((id) => mealDefs.find((meal) => meal.id === id))
    .filter((meal): meal is MealDef => Boolean(meal))

  /**
   * FLIP : quand une carte non tenue change de position suite à un
   * échange, elle glisse jusqu'à sa nouvelle place au lieu d'y sauter —
   * la carte tenue, elle, suit déjà le doigt en continu via onDragMove.
   */
  const prevTopsRef = useRef<Map<string, number>>(new Map())
  useLayoutEffect(() => {
    const prevTops = prevTopsRef.current
    orderedMeals.forEach((meal) => {
      const node = nodeRefs.current.get(meal.id)
      if (!node || meal.id === draggingId) return
      const prevTop = prevTops.get(meal.id)
      const newTop = node.getBoundingClientRect().top
      if (prevTop !== undefined && prevTop !== newTop) {
        const delta = prevTop - newTop
        node.style.transition = 'none'
        node.style.transform = `translateY(${delta}px)`
        node.getBoundingClientRect() // force le reflow avant de relâcher la transition
        requestAnimationFrame(() => {
          node.style.transition = 'transform 200ms ease'
          node.style.transform = ''
        })
      }
      prevTops.set(meal.id, newTop)
    })
  }, [order, draggingId])

  const endDrag = () => {
    const info = dragInfo.current
    if (info) {
      if (info.longPressTimer) window.clearTimeout(info.longPressTimer)
      const node = nodeRefs.current.get(info.id)
      if (node) {
        node.style.transition = ''
        node.style.transform = ''
        // Sans ça, la prochaine passe FLIP comparerait la position au repos à
        // une mesure prise avant le dépôt et ferait sauter la carte qu'on vient de lâcher.
        prevTopsRef.current.set(info.id, node.getBoundingClientRect().top)
      }
      if (info.active) reorderMeals(orderRef.current)
    }
    dragInfo.current = null
    setDraggingId(null)
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
  }

  const onDragMove = (event: PointerEvent) => {
    const info = dragInfo.current
    if (!info) return

    if (!info.active) {
      if (
        Math.abs(event.clientX - info.pointerStartX) > MOVE_CANCEL_PX ||
        Math.abs(event.clientY - info.pointerStartY) > MOVE_CANCEL_PX
      ) {
        // Le doigt a bougé avant la fin de l'appui long : c'est un scroll, pas un glisser.
        if (info.longPressTimer) window.clearTimeout(info.longPressTimer)
        dragInfo.current = null
        window.removeEventListener('pointermove', onDragMove)
        window.removeEventListener('pointerup', endDrag)
        window.removeEventListener('pointercancel', endDrag)
      }
      return
    }

    const translateY = event.clientY - info.pointerStartY
    const node = nodeRefs.current.get(info.id)
    if (node) {
      // Le premier mouvement coupe la transition d'agrippement : au-delà, le
      // doigt doit être suivi au pixel près, sans le moindre retard animé.
      node.style.transition = 'none'
      node.style.transform = `translateY(${translateY}px) scale(1.02)`
    }

    const visualCenter = info.naturalTop + translateY + info.height / 2
    const current = orderRef.current
    const idx = current.indexOf(info.id)

    if (idx < current.length - 1) {
      const nextNode = nodeRefs.current.get(current[idx + 1])
      if (nextNode) {
        const nextRect = nextNode.getBoundingClientRect()
        if (visualCenter > nextRect.top + nextRect.height / 2) {
          info.naturalTop += nextRect.height
          const next = [...current]
          ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
          setOrder(next)
          return
        }
      }
    }
    if (idx > 0) {
      const prevNode = nodeRefs.current.get(current[idx - 1])
      if (prevNode) {
        const prevRect = prevNode.getBoundingClientRect()
        if (visualCenter < prevRect.top + prevRect.height / 2) {
          info.naturalTop -= prevRect.height
          const next = [...current]
          ;[next[idx], next[idx - 1]] = [next[idx - 1], next[idx]]
          setOrder(next)
        }
      }
    }
  }

  const onGripPointerDown = (id: string, event: React.PointerEvent) => {
    event.preventDefault()
    const pointerId = event.pointerId
    const pointerStartX = event.clientX
    const pointerStartY = event.clientY

    const timer = window.setTimeout(() => {
      const node = nodeRefs.current.get(id)
      if (!node || !dragInfo.current) return
      const rect = node.getBoundingClientRect()
      dragInfo.current = {
        ...dragInfo.current,
        naturalTop: rect.top,
        height: rect.height,
        longPressTimer: null,
        active: true,
      }
      setDraggingId(id)
      // Petit effet de saisie immédiat, avant même le premier mouvement du doigt.
      node.style.transition = 'transform 120ms ease'
      node.style.transform = 'scale(1.02)'
      try {
        node.setPointerCapture(pointerId)
      } catch {
        // Le pointeur a pu être relâché entre-temps : rien à faire de plus.
      }
    }, LONG_PRESS_MS)

    dragInfo.current = {
      id,
      pointerId,
      pointerStartX,
      pointerStartY,
      naturalTop: 0,
      height: 0,
      longPressTimer: timer,
      active: false,
    }

    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  }

  // --- Renommage d'un repas ---
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const startRename = (meal: MealDef) => {
    setRenamingId(meal.id)
    setRenameValue(mealLabel(meal, t))
  }

  const commitRename = () => {
    if (renamingId) renameMeal(renamingId, renameValue)
    setRenamingId(null)
  }

  // --- Ajout d'un repas personnalisé (jusqu'à MAX_CUSTOM_MEALS) ---
  const [addingMeal, setAddingMeal] = useState(false)
  const [newMealName, setNewMealName] = useState('')
  const customMealCount = mealDefs.filter((meal) => !DEFAULT_MEALS.some((entry) => entry.id === meal.id)).length
  const canAddMeal = customMealCount < MAX_CUSTOM_MEALS

  const commitAddMeal = () => {
    if (newMealName.trim()) addMeal(newMealName)
    setNewMealName('')
    setAddingMeal(false)
  }

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

      {orderedMeals.map((meal) => {
        const items = byMeal.get(meal.id) ?? []
        const total = sumNutrients(items.map((entry) => entry.nutrients))
        return (
          <section
            className={`meal${draggingId === meal.id ? ' dragging' : ''}`}
            key={meal.id}
            ref={(node) => {
              if (node) nodeRefs.current.set(meal.id, node)
              else nodeRefs.current.delete(meal.id)
            }}
          >
            <header className="meal-head">
              <button
                type="button"
                className="meal-grip"
                aria-label={t('diary.reorderMeal')}
                onPointerDown={(event) => onGripPointerDown(meal.id, event)}
              >
                <IconGrip size={22} />
              </button>

              {renamingId === meal.id ? (
                <input
                  type="text"
                  autoComplete="off"
                  className="meal-rename-input"
                  value={renameValue}
                  autoFocus
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitRename()
                    if (event.key === 'Escape') setRenamingId(null)
                  }}
                />
              ) : (
                <span className="name">{mealLabel(meal, t)}</span>
              )}

              <button
                type="button"
                className="icon-btn"
                aria-label={t('diary.renameMeal')}
                onClick={() => startRename(meal)}
              >
                <IconEdit size={15} />
              </button>

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

            <button type="button" className="meal-add" onClick={() => onAddTo(meal.id)}>
              <IconPlus size={16} />
              {t('diary.addFood')}
            </button>
          </section>
        )
      })}

      {canAddMeal ? (
        addingMeal ? (
          <div className="meal-new-row">
            <input
              type="text"
              autoComplete="off"
              autoFocus
              value={newMealName}
              placeholder={t('diary.newMealPlaceholder')}
              onChange={(event) => setNewMealName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitAddMeal()
                if (event.key === 'Escape') {
                  setNewMealName('')
                  setAddingMeal(false)
                }
              }}
            />
            <button type="button" className="btn small" onClick={commitAddMeal}>
              {t('common.save')}
            </button>
          </div>
        ) : (
          <button type="button" className="btn secondary" onClick={() => setAddingMeal(true)}>
            <IconPlus size={16} />
            {t('diary.addMeal')}
          </button>
        )
      ) : null}

      <button type="button" className="btn secondary" onClick={handleCopy}>
        <IconCopy />
        {t('diary.copyPrev')}
      </button>

      {noteOpen ? <DayNoteSheet date={date} onClose={() => setNoteOpen(false)} /> : null}
    </div>
  )
}
