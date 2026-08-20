import { IconChat } from './icons'
import { useApp } from '../state/AppContext'

interface ChatButtonProps {
  onClick: () => void
}

/** Bouton flottant, coin inférieur droit, façon WhatsApp : ouvre l'assistant nutrition. */
export function ChatButton({ onClick }: ChatButtonProps) {
  const { t } = useApp()
  return (
    <button type="button" className="chat-fab" onClick={onClick} aria-label={t('chat.title')}>
      <IconChat size={26} />
    </button>
  )
}
