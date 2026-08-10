import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { FoodPicker } from '../components/FoodPicker'
import { QuantitySheet } from '../components/QuantitySheet'
import { CustomFoodSheet } from '../components/CustomFoodSheet'
import { formatDay } from '../lib/date'
import type { Food, MealId } from '../lib/types'

interface AddScreenProps {
  date: string
  meal: MealId
  onAdded: (message: string) => void
}

export function AddScreen({ date, meal, onAdded }: AddScreenProps) {
  const { t, lang, addEntry, removeCustomFood } = useApp()
  const [selected, setSelected] = useState<Food | null>(null)
  const [creating, setCreating] = useState<string | null>(null)

  return (
    <div className="screen">
      <p className="hint">
        {t('add.title')} — {formatDay(date, lang)}
      </p>

      <FoodPicker onSelect={setSelected} onCreate={(query) => setCreating(query.trim())} />

      {selected ? (
        <QuantitySheet
          food={selected}
          meal={meal}
          onClose={() => setSelected(null)}
          onConfirm={(grams, chosenMeal, state) => {
            addEntry(date, chosenMeal, selected, grams, state)
            setSelected(null)
            onAdded(t('add.added'))
          }}
          onDelete={
            selected.custom
              ? () => {
                  removeCustomFood(selected.id)
                  setSelected(null)
                }
              : undefined
          }
        />
      ) : null}

      {creating !== null ? (
        <CustomFoodSheet
          initialName={creating}
          onClose={() => setCreating(null)}
          onCreated={(food) => {
            setCreating(null)
            setSelected(food)
          }}
        />
      ) : null}
    </div>
  )
}
