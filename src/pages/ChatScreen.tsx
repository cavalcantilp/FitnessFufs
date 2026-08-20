import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { AnthropicError, askAssistant } from '../lib/anthropic'
import { MONTHLY_CAP_USD } from '../lib/usage'
import { extractMealSuggestions } from '../lib/mealSuggestions'
import { foodName } from '../lib/foods'
import { sumNutrients } from '../lib/nutrition'
import { todayKey } from '../lib/date'
import { defaultMeal } from '../lib/meals'
import { IconCheck, IconChevronLeft, IconSend, IconTrash } from '../components/icons'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { ChatMealSuggestion, ChatMessage, FoodState, Lang } from '../lib/types'

interface ChatScreenProps {
  onClose: () => void
  onOpenProfile: () => void
  onToast: (message: string) => void
}

interface FridgeIndexItem {
  id: string
  label: string
  grams: number
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
  fridgeIndex: FridgeIndexItem[],
  remaining: { kcal: number; protein: number; carbs: number; fat: number },
): string {
  const fridgeBlock =
    fridgeIndex.length > 0
      ? fridgeIndex.map((item) => `- id="${item.id}" | ${item.label} | ${item.grams} g disponibles`).join('\n')
      : '(vide)'
  return [
    "Tu es l'assistant nutrition intégré à l'application FitnessFufs. Réponds dans la langue du dernier " +
      'message de l\'utilisateur.',
    '',
    'Sois bref, systématiquement : va droit à la proposition concrète, sans salutation, sans reformuler ' +
      "la question, sans conclusion ni rappel des macros déjà donnés plus haut. Deux ou trois phrases " +
      'courtes suffisent la plupart du temps ; une liste à puces brève si plusieurs idées sont utiles. ' +
      "Jamais de longs paragraphes explicatifs, jamais d'options multiples détaillées sauf si demandé.",
    '',
    'Aliments actuellement au frigo (avec identifiant technique interne, à ne jamais citer dans ta réponse ' +
      'visible) :',
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
    '',
    "Si ta réponse propose un ou plusieurs repas concrets à partir des aliments du frigo listés ci-dessus, " +
      "ajoute tout à la fin, sur une seule ligne, ce bloc cache (jamais montré tel quel, jamais mentionné " +
      'dans ta réponse) : <meals>[{"label":"court résumé du repas","items":[{"foodId":"identifiant exact ' +
      'listé ci-dessus","grams":nombre,"state":"raw ou cooked, uniquement si applicable"}]}]</meals>. Un ' +
      "objet par repas proposé. N'utilise jamais un foodId qui n'est pas listé ci-dessus — pour un " +
      "ingrédient à ajouter absent du frigo, ne l'inclus simplement pas dans ce bloc. Si aucun repas " +
      "concret n'est proposé dans cette réponse, ajoute quand même <meals>[]</meals>. Ce bloc doit " +
      'toujours être la toute dernière chose de ta réponse, rien après lui.',
  ].join('\n')
}

export function ChatScreen({ onClose, onOpenProfile, onToast }: ChatScreenProps) {
  const {
    t,
    lang,
    foods,
    fridge,
    targetsFor,
    entriesFor,
    addEntry,
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
  // Repas déjà envoyés au journal, identifiés par "id du message-index du repas" —
  // sert uniquement à désactiver le bouton une fois cliqué, pas persisté.
  const [sentMeals, setSentMeals] = useState<Record<string, boolean>>({})
  const [confirmingClear, setConfirmingClear] = useState(false)
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
      const fridgeIndex: FridgeIndexItem[] = fridge
        .map((item) => {
          const food = foods.find((entry) => entry.id === item.foodId)
          if (!food) return null
          return { id: item.foodId, label: `${foodName(food, lang)}${stateLabel(item.state)}`, grams: item.grams }
        })
        .filter((entry): entry is FridgeIndexItem => Boolean(entry))
      const system = buildSystemPrompt(lang, fridgeIndex, remaining)
      const reply = await askAssistant(apiKey, [...chatMessages, userMessage], system)
      const { text, meals } = extractMealSuggestions(reply.text, foods)
      addChatMessage({
        id: newId(),
        role: 'assistant',
        text,
        at: new Date().toISOString(),
        meals: meals.length > 0 ? meals : undefined,
      })
      addUsageCost(reply.costUsd)
    } catch (err) {
      setError(err instanceof AnthropicError ? err.message : t('chat.error'))
    } finally {
      setSending(false)
    }
  }

  const sendMealToDiary = (messageId: string, mealIndex: number, items: ChatMealSuggestion['items']) => {
    const date = todayKey()
    const meal = defaultMeal()
    for (const item of items) {
      const food = foods.find((entry) => entry.id === item.foodId)
      if (!food) continue
      addEntry(date, meal, food, item.grams, item.state)
    }
    setSentMeals((current) => ({ ...current, [`${messageId}-${mealIndex}`]: true }))
    onToast(t('chat.mealAdded'))
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
            onClick={() => setConfirmingClear(true)}
            aria-label={t('chat.clear')}
          >
            <IconTrash size={18} />
          </button>
        ) : null}
      </div>

      <div className="chat-messages" ref={listRef}>
        {chatMessages.length === 0 ? <p className="hint">{t('chat.empty')}</p> : null}
        {chatMessages.map((message) => (
          <div key={message.id} className="chat-message-group">
            <div className={`chat-bubble ${message.role}`}>{message.text}</div>
            {message.meals && message.meals.length > 0 ? (
              <div className="meal-actions">
                {message.meals.map((suggestion, index) => {
                  const sent = sentMeals[`${message.id}-${index}`]
                  return (
                    <button
                      type="button"
                      className="meal-btn"
                      key={index}
                      disabled={sent}
                      onClick={() => sendMealToDiary(message.id, index, suggestion.items)}
                    >
                      <span>{suggestion.label}</span>
                      {sent ? <IconCheck size={16} /> : <span className="meal-btn-cta">{t('chat.sendToDiary')}</span>}
                    </button>
                  )
                })}
              </div>
            ) : null}
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

      {confirmingClear ? (
        <ConfirmDialog
          message={t('chat.clearConfirm')}
          confirmLabel={t('chat.clear')}
          cancelLabel={t('common.cancel')}
          danger
          onCancel={() => setConfirmingClear(false)}
          onConfirm={() => {
            clearChat()
            setConfirmingClear(false)
          }}
        />
      ) : null}
    </div>
  )
}
