import { useState } from 'react'
import { Sheet } from './Sheet'
import { useApp } from '../state/AppContext'
import { kcalFromMacros } from '../lib/nutrition'
import { FOOD_CATEGORIES } from '../lib/foods'
import type { Food, FoodCategory } from '../lib/types'
import type { TranslationKey } from '../i18n/translations'

interface CustomFoodSheetProps {
  /** Nom pré-rempli depuis la recherche en cours. */
  initialName?: string
  /**
   * Aliment à corriger. Les valeurs d'Open Food Facts viennent de saisies
   * communautaires et peuvent différer de l'étiquette qu'on a sous les yeux :
   * il faut pouvoir les rectifier plutôt que subir un chiffre faux.
   */
  editing?: Food
  onCreated: (food: Food) => void
  onClose: () => void
}

export function CustomFoodSheet({
  initialName = '',
  editing,
  onCreated,
  onClose,
}: CustomFoodSheetProps) {
  const { t, addCustomFood, updateCustomFood } = useApp()
  const text = (value: number | undefined) => (value === undefined || value === 0 ? '' : String(value))
  const [name, setName] = useState(editing?.name ?? initialName)
  const [kcal, setKcal] = useState(text(editing?.per100.kcal))
  const [protein, setProtein] = useState(text(editing?.per100.protein))
  const [carbs, setCarbs] = useState(text(editing?.per100.carbs))
  const [fat, setFat] = useState(text(editing?.per100.fat))
  const [fiber, setFiber] = useState(text(editing?.per100.fiber))
  const [serving, setServing] = useState(String(editing?.serving ?? 100))
  const [category, setCategory] = useState<FoodCategory>(editing?.category ?? 'dish')

  const num = (value: string) => {
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }

  const derivedKcal = kcalFromMacros(num(protein), num(carbs), num(fat))
  // Les calories saisies priment ; à défaut on les reconstitue depuis les macros.
  const finalKcal = kcal.trim() ? Math.round(num(kcal)) : derivedKcal
  const valid = name.trim().length > 0 && finalKcal > 0

  const submit = () => {
    if (!valid) return
    const per100 = {
      kcal: finalKcal,
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
      fiber: num(fiber),
    }
    const portion = Math.max(1, Math.round(num(serving)) || 100)

    if (editing) {
      updateCustomFood(editing.id, { name: name.trim(), per100, serving: portion, category })
      onCreated({ ...editing, name: name.trim(), per100, serving: portion, category })
      return
    }

    const created = addCustomFood({
      name: name.trim(),
      per100: {
        kcal: finalKcal,
        protein: num(protein),
        carbs: num(carbs),
        fat: num(fat),
        fiber: num(fiber),
      },
      serving: Math.max(1, Math.round(num(serving)) || 100),
      category,
    })
    onCreated(created)
  }

  return (
    <Sheet
      title={editing ? t('add.editFood') : t('add.custom')}
      subtitle={t('add.customHint')}
      onClose={onClose}
    >
      <div className="field">
        <label htmlFor="cf-name">{t('add.customName')}</label>
        <input
          id="cf-name"
          name="cf-name"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="cf-kcal">{t('macro.kcal')}</label>
          <input
            id="cf-kcal"
            name="cf-kcal"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={kcal}
            onChange={(event) => setKcal(event.target.value)}
            placeholder={String(derivedKcal)}
          />
        </div>
        <div className="field">
          <label htmlFor="cf-serving">{t('add.quantity')}</label>
          <input
            id="cf-serving"
            name="cf-serving"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={serving}
            onChange={(event) => setServing(event.target.value)}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="cf-fiber">{t('macro.fiber')}</label>
          <input
            id="cf-fiber"
            name="cf-fiber"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={fiber}
            onChange={(event) => setFiber(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cf-cat">{t('add.category')}</label>
          <select
            id="cf-cat"
            value={category}
            onChange={(event) => setCategory(event.target.value as FoodCategory)}
          >
            {FOOD_CATEGORIES.map((entry) => (
              <option key={entry} value={entry}>
                {t(`cat.${entry}` as TranslationKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-3">
        <div className="field">
          <label htmlFor="cf-p">{t('macro.protein')}</label>
          <input
            id="cf-p"
            name="cf-p"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={protein}
            onChange={(event) => setProtein(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cf-c">{t('macro.carbs')}</label>
          <input
            id="cf-c"
            name="cf-c"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={carbs}
            onChange={(event) => setCarbs(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cf-f">{t('macro.fat')}</label>
          <input
            id="cf-f"
            name="cf-f"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={fat}
            onChange={(event) => setFat(event.target.value)}
          />
        </div>
      </div>

      {!kcal.trim() && derivedKcal > 0 ? (
        <p className="hint">{t('add.kcalMismatch', { n: derivedKcal })}</p>
      ) : null}

      <button type="button" className="btn" disabled={!valid} onClick={submit}>
        {t('common.save')}
      </button>
    </Sheet>
  )
}
