import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { localeOf } from '../lib/date'

interface NumberFieldProps {
  id: string
  label: string
  value: number
  onCommit: (value: number) => void
  min?: number
  max?: number
  inputMode?: 'numeric' | 'decimal'
}

/** Chiffres, avec au plus un séparateur décimal (point ou virgule). */
const ALLOWED = /^[0-9]*[.,]?[0-9]*$/

export function parseNumber(raw: string): number {
  return Number(raw.replace(',', '.'))
}

/**
 * Champ numérique dont l'affichage suit la frappe, pas la valeur du modèle.
 *
 * Deux pièges que ce composant écarte :
 *
 * 1. Un `<input type="number">` piloté par un nombre se désynchronise. React
 *    compare l'ancienne et la nouvelle valeur de façon lâche, donc « 090 » et
 *    90 lui paraissent identiques et le champ garde le zéro parasite à l'écran.
 *    Le texte saisi est ici gardé en état local : ce qui est affiché est
 *    exactement ce qui a été tapé.
 *
 * 2. Un `type="number"` refuse la virgule, que les claviers français,
 *    portugais, espagnols et italiens proposent en premier : « 88,4 » arrivait
 *    amputé en « 884 ». Le champ est donc en `type="text"` avec `inputMode`
 *    pour garder le pavé numérique sur mobile, et la saisie est filtrée.
 *
 * Effet de bord souhaitable : le champ peut être vidé le temps d'une saisie
 * sans que le profil retombe à zéro.
 */
export function NumberField({
  id,
  label,
  value,
  onCommit,
  min,
  max,
  inputMode = 'numeric',
}: NumberFieldProps) {
  const { lang } = useApp()

  /** Réaffiche avec le séparateur de la langue : un francophone retrouve « 88,4 ». */
  const format = (n: number) =>
    n.toLocaleString(localeOf(lang), { maximumFractionDigits: 2, useGrouping: false })

  const [draft, setDraft] = useState(() => format(value))
  const committed = useRef(value)

  // Resynchronise quand la valeur change ailleurs : pesée du jour, import, remise à zéro.
  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value
      setDraft(format(value))
    }
  }, [value, lang])

  const handleChange = (raw: string) => {
    if (!ALLOWED.test(raw)) return
    setDraft(raw)
    const parsed = parseNumber(raw)
    if (raw.trim() !== '' && Number.isFinite(parsed) && parsed > 0) {
      committed.current = parsed
      onCommit(parsed)
    }
  }

  /**
   * À la sortie du champ : « 090 » redevient 90, une valeur hors bornes est
   * ramenée dans la plage, et un champ laissé vide reprend la dernière valeur
   * valide.
   */
  const handleBlur = () => {
    const parsed = parseNumber(draft)
    if (draft.trim() === '' || !Number.isFinite(parsed) || parsed <= 0) {
      setDraft(format(value))
      return
    }
    const clamped = Math.min(Math.max(parsed, min ?? parsed), max ?? parsed)
    committed.current = clamped
    setDraft(format(clamped))
    if (clamped !== value) onCommit(clamped)
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
      />
    </div>
  )
}
