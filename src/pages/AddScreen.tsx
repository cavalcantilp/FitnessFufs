import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import { FoodPicker } from '../components/FoodPicker'
import { QuantitySheet } from '../components/QuantitySheet'
import { CustomFoodSheet } from '../components/CustomFoodSheet'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { NutritionTargetScreen } from './NutritionTargetScreen'
import { fetchByBarcode } from '../lib/openfoodfacts'
import { formatDay } from '../lib/date'
import type { Food, MealId } from '../lib/types'

export type AddView = 'list' | 'custom' | 'target'

interface AddScreenProps {
  date: string
  meal: MealId
  onAdded: (message: string) => void
  /** Un aliment vient d'être journalisé : on revient au journal, comme après une saisie MyFitnessPal. */
  onLogged: () => void
  /** Sous-écran affiché, pour que le tutoriel de l'en-tête cible la bonne visite guidée. */
  onViewChange: (view: AddView) => void
}

export function AddScreen({ date, meal, onAdded, onLogged, onViewChange }: AddScreenProps) {
  const { t, lang, addEntry, removeCustomFood, saveFood } = useApp()
  const [selected, setSelected] = useState<Food | null>(null)
  const [creating, setCreating] = useState<string | null>(null)
  const [editing, setEditing] = useState<Food | null>(null)
  const [scanning, setScanning] = useState(false)
  const [showTarget, setShowTarget] = useState(false)

  // Prévient le parent du sous-écran affiché, pour que le bouton d'aide et le
  // déclenchement automatique ciblent la bonne visite guidée. Réinitialisé en
  // quittant l'onglet, pour ne pas laisser un sous-écran fantôme au retour.
  useEffect(() => {
    const view: AddView = creating !== null || editing ? 'custom' : showTarget ? 'target' : 'list'
    onViewChange(view)
    return () => onViewChange('list')
  }, [creating, editing, showTarget, onViewChange])

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

  // Chaque étape occupe l'écran en entier, comme une page à part plutôt
  // qu'une feuille superposée à la liste : sur mobile, une feuille plafonnée
  // à 90vh finissait masquée par le clavier, et ce n'est pas ainsi que
  // MyFitnessPal enchaîne recherche → quantité → confirmation.
  if (scanning) {
    return (
      <BarcodeScanner onDetect={(code) => void resolveBarcode(code)} onClose={() => setScanning(false)} />
    )
  }

  if (selected) {
    return (
      <QuantitySheet
        food={selected}
        meal={meal}
        onClose={() => setSelected(null)}
        onConfirm={(grams, chosenMeal, state) => {
          addEntry(date, chosenMeal, selected, grams, state)
          setSelected(null)
          onAdded(t('add.added'))
          onLogged()
        }}
        onEdit={
          selected.custom
            ? () => {
                setEditing(selected)
                setSelected(null)
              }
            : undefined
        }
        onDelete={
          selected.custom
            ? () => {
                removeCustomFood(selected.id)
                setSelected(null)
              }
            : undefined
        }
      />
    )
  }

  if (creating !== null) {
    return (
      <CustomFoodSheet
        initialName={creating}
        onClose={() => setCreating(null)}
        onCreated={(food) => {
          setCreating(null)
          setSelected(food)
        }}
      />
    )
  }

  if (editing) {
    return (
      <CustomFoodSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onCreated={(food) => {
          setEditing(null)
          setSelected(food)
          onAdded(t('add.updated'))
        }}
      />
    )
  }

  if (showTarget) {
    return (
      <NutritionTargetScreen
        date={date}
        meal={meal}
        onBack={() => setShowTarget(false)}
        onAdded={onAdded}
        onLogged={onLogged}
      />
    )
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
        onTarget={() => setShowTarget(true)}
        onToast={onAdded}
      />
    </div>
  )
}
