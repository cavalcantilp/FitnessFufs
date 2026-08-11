import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { FoodPicker } from '../components/FoodPicker'
import { QuantitySheet } from '../components/QuantitySheet'
import { CustomFoodSheet } from '../components/CustomFoodSheet'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { fetchByBarcode } from '../lib/openfoodfacts'
import { formatDay } from '../lib/date'
import type { Food, MealId } from '../lib/types'

interface AddScreenProps {
  date: string
  meal: MealId
  onAdded: (message: string) => void
}

export function AddScreen({ date, meal, onAdded }: AddScreenProps) {
  const { t, lang, addEntry, removeCustomFood, saveFood } = useApp()
  const [selected, setSelected] = useState<Food | null>(null)
  const [creating, setCreating] = useState<string | null>(null)
  const [editing, setEditing] = useState<Food | null>(null)
  const [scanning, setScanning] = useState(false)

  /**
   * Un code scanné est résolu chez Open Food Facts puis rangé dans les
   * aliments personnels : le produit reste disponible hors ligne ensuite.
   */
  const resolveBarcode = async (barcode: string) => {
    setScanning(false)
    try {
      const found = await fetchByBarcode(barcode, lang)
      if (found) {
        setSelected(saveFood(found))
      } else {
        onAdded(t('scan.notFound'))
      }
    } catch {
      onAdded(t('scan.failed'))
    }
  }

  return (
    <div className="screen">
      <p className="hint">
        {t('add.title')} — {formatDay(date, lang)}
      </p>

      <FoodPicker
        onSelect={(food) => setSelected(food.source === 'off' ? saveFood(food) : food)}
        onCreate={(query) => setCreating(query.trim())}
        onScan={() => setScanning(true)}
      />

      {scanning ? (
        <BarcodeScanner onDetect={(code) => void resolveBarcode(code)} onClose={() => setScanning(false)} />
      ) : null}

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
          onEdit={selected.custom ? () => setEditing(selected) : undefined}
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

      {editing ? (
        <CustomFoodSheet
          editing={editing}
          onClose={() => setEditing(null)}
          onCreated={(food) => {
            setEditing(null)
            setSelected(food)
            onAdded(t('add.updated'))
          }}
        />
      ) : null}
    </div>
  )
}
