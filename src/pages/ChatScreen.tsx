import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { AnthropicError, askAssistant } from '../lib/anthropic'
import { MONTHLY_CAP_USD } from '../lib/usage'
import { foodName } from '../lib/foods'
import { sumNutrients } from '../lib/nutrition'
import { todayKey } from '../lib/date'
import { IconChevronLeft, IconSend, IconTrash } from '../components/icons'
import type { ChatMessage, FoodState, Lang } from '../lib/types'

interface ChatScreenProps {
  onClose: () => void
  onOpenProfile: () => void
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const SUGGESTIONS = ['chat.suggest.plan', 'chat.suggest.remaining', 'chat.suggest.quick'] as const

/**
 * Construit le contexte invisible envoyé à chaque appel : ce qu'il y a au
 * frigo et ce qu'il reste à manger aujourd'hui. Sans lui, l'utilisateur
 * devrait retaper cette information à chaque message.
 */
function buildSystemPrompt(
  lang: Lang,
  fridgeLines: string[],
  remaining: { kcal: number; protein: number; carbs: number; fat: number },
): string {
  const fridgeBlock = fridgeLines.length > 0 ? fridgeLines.map((line) => `- ${line}`).join('\n') : '(vide)'
  return [
    "Tu es l'assistant nutrition intégré à l'application FitnessFufs. Réponds dans la langue du dernier " +
      'message de l\'utilisateur.',
    '',
    'Sois bref, systématiquement : va droit à la proposition concrète, sans salutation, sans reformuler ' +
      "la question, sans conclusion ni rappel des macros déjà donnés plus haut. Deux ou trois phrases " +
      'courtes suffisent la plupart du temps ; une liste à puces brève si plusieurs idées sont utiles. ' +
      "Jamais de longs paragraphes explicatifs, jamais d'options multiples détaillées sauf si demandé.",
    '',
    'Aliments actuellement au frigo :',
    fridgeBlock,
    '',
    "Macros restants pour aujourd'hui (objectif du jour moins ce qui a déjà été mangé) :",
    `- Calories : ${remaining.kcal} kcal`,
    `- Protéines : ${remaining.protein} g`,
    `- Glucides : ${remaining.carbs} g`,
    `- Lipides : ${remaining.fat} g`,
    '',
    'Propose des idées de repas réalistes avec ce qui est au frigo, en tenant compte de ces macros ' +
      "restants. Indique les quantités à utiliser parmi ce qui est disponible. Tu peux suggérer un " +
      'ingrédient simple à ajouter si peu de choses manquent. (Langue de référence de l\'application : ' +
      lang +
      '.)',
  ].join('\n')
}

export function ChatScreen({ onClose, onOpenProfile }: ChatScreenProps) {
  const {
    t,
    lang,
    foods,
    fridge,
    targetsFor,
    entriesFor,
    apiKey,
    chatMessages,
    addChatMessage,
    clearChat,
    usage,
    addUsageCost,
  } = useApp()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Réinitialisé à chaque ouverture (ChatScreen est remonté à chaque fois) :
  // les suggestions reviennent à chaque visite, et disparaissent dès qu'on
  // envoie un message dans cette visite, historique ou pas.
  const [interacted, setInteracted] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Estimation seulement — pas une vraie limite de facturation Anthropic —
  // mais suffisante pour éviter les mauvaises surprises côté personnel.
  const capped = usage.costUsd >= MONTHLY_CAP_USD

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [chatMessages, sending])

  const stateLabel = (state: FoodState | undefined) =>
    state ? ` (${t(state === 'raw' ? 'state.raw' : 'state.cooked').toLowerCase()})` : ''

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending || !apiKey || capped) return
    setInput('')
    setError(null)
    setInteracted(true)
    const userMessage: ChatMessage = { id: newId(), role: 'user', text: trimmed, at: new Date().toISOString() }
    addChatMessage(userMessage)
    setSending(true)
    try {
      const today = todayKey()
      const targets = targetsFor(today)
      const eaten = sumNutrients(entriesFor(today).map((entry) => entry.nutrients))
      const remaining = {
        kcal: Math.round(targets.kcal - eaten.kcal),
        protein: Math.round(targets.protein - eaten.protein),
        carbs: Math.round(targets.carbs - eaten.carbs),
        fat: Math.round(targets.fat - eaten.fat),
      }
      const fridgeLines = fridge
        .map((item) => {
          const food = foods.find((entry) => entry.id === item.foodId)
          if (!food) return null
          return `${foodName(food, lang)}${stateLabel(item.state)} : ${item.grams} g`
        })
        .filter((line): line is string => Boolean(line))
      const system = buildSystemPrompt(lang, fridgeLines, remaining)
      const reply = await askAssistant(apiKey, [...chatMessages, userMessage], system)
      addChatMessage({ id: newId(), role: 'assistant', text: reply.text, at: new Date().toISOString() })
      addUsageCost(reply.costUsd)
    } catch (err) {
      setError(err instanceof AnthropicError ? err.message : t('chat.error'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat-screen">
      <div className="chat-head">
        <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
          <IconChevronLeft />
        </button>
        <div className="chat-head-title">
          <h2>{t('chat.title')}</h2>
        </div>
        {chatMessages.length > 0 ? (
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => {
              if (window.confirm(t('chat.clearConfirm'))) clearChat()
            }}
            aria-label={t('chat.clear')}
          >
            <IconTrash size={18} />
          </button>
        ) : null}
      </div>

      <div className="chat-messages" ref={listRef}>
        {chatMessages.length === 0 ? <p className="hint">{t('chat.empty')}</p> : null}
        {chatMessages.map((message) => (
          <div className={`chat-bubble ${message.role}`} key={message.id}>
            {message.text}
          </div>
        ))}
        {sending ? (
          <div className="chat-bubble assistant pending" role="status" aria-label={t('chat.thinking')}>
            <span className="typing-dots">
              <span />
              <span />
              <span />
            </span>
          </div>
        ) : null}
      </div>

      {error ? <p className="notice chat-error">{error}</p> : null}

      {!interacted && !capped ? (
        <div className="chip-list">
          {SUGGESTIONS.map((key) => (
            <button type="button" className="chip" key={key} onClick={() => void send(t(key))} disabled={!apiKey}>
              {t(key)}
            </button>
          ))}
        </div>
      ) : null}

      {!apiKey ? (
        <div className="notice info chat-nokey">
          <span>{t('chat.noKey')}</span>
          <button type="button" className="btn secondary" onClick={onOpenProfile}>
            {t('nav.profile')}
          </button>
        </div>
      ) : capped ? (
        <div className="notice chat-nokey">
          <span>{t('chat.capped', { cap: MONTHLY_CAP_USD.toFixed(2) })}</span>
          <button type="button" className="btn secondary" onClick={onOpenProfile}>
            {t('nav.profile')}
          </button>
        </div>
      ) : (
        <form
          className="chat-input-row"
          onSubmit={(event) => {
            event.preventDefault()
            void send(input)
          }}
        >
          <input
            type="text"
            autoComplete="off"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('chat.placeholder')}
            aria-label={t('chat.placeholder')}
          />
          <button type="submit" className="chat-send" disabled={!input.trim() || sending} aria-label={t('chat.send')}>
            <IconSend />
          </button>
        </form>
      )}
    </div>
  )
}
