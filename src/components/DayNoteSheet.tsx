import { useState } from 'react'
import { Sheet } from './Sheet'
import { useApp } from '../state/AppContext'
import { formatDay } from '../lib/date'

interface DayNoteSheetProps {
  date: string
  onClose: () => void
}

/**
 * Note libre d'une journée, ouverte par une simple pression sur le
 * calendrier — l'ouverture du journal, elle, demande de rester appuyé,
 * d'où le rappel du geste en bas de la feuille.
 */
export function DayNoteSheet({ date, onClose }: DayNoteSheetProps) {
  const { t, lang, notes, setNoteFor } = useApp()
  const [draft, setDraft] = useState(notes[date] ?? '')

  const save = () => {
    setNoteFor(date, draft)
    onClose()
  }

  return (
    <Sheet title={t('day.noteTitle')} subtitle={formatDay(date, lang)} onClose={onClose}>
      <div className="stack">
        <textarea
          rows={4}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('day.notePlaceholder')}
          autoFocus
        />

        <button type="button" className="btn" onClick={save}>
          {t('day.noteSave')}
        </button>

        {notes[date] ? (
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              setNoteFor(date, '')
              onClose()
            }}
          >
            {t('day.noteDelete')}
          </button>
        ) : null}

        <p className="hint">{t('day.noteHoldHint')}</p>
      </div>
    </Sheet>
  )
}
