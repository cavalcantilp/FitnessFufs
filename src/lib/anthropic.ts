import type { ChatMessage } from './types'

const API_URL = 'https://api.anthropic.com/v1/messages'
/** Haiku 4.5 : le moins cher des modèles Claude actuels, cohérent avec un plafond de dépense serré. */
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 1024

/** Tarifs Haiku 4.5 par million de tokens — sert à l'estimation affichée dans le profil. */
export const PRICE_PER_MILLION_INPUT = 1
export const PRICE_PER_MILLION_OUTPUT = 5

export function estimateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICE_PER_MILLION_INPUT + (outputTokens / 1_000_000) * PRICE_PER_MILLION_OUTPUT
  )
}

/**
 * Une surcharge ponctuelle des serveurs Anthropic (429/529) mérite une
 * relance ; toute autre erreur (clé invalide, requête malformée) échoue
 * immédiatement puisqu'une relance n'y changerait rien.
 */
const RETRY_DELAYS_MS = [1500, 3000]

export class AnthropicError extends Error {}

export interface AssistantReply {
  text: string
  /** Coût estimé de cet échange, à partir des tokens facturés renvoyés par l'API. */
  costUsd: number
}

async function callOnce(apiKey: string, history: ChatMessage[], system: string) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Header exigé par Anthropic pour un appel direct depuis un navigateur :
      // cas prévu pour un usage individuel, où la clé appartient à qui l'envoie.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: history.map((message) => ({ role: message.role, content: message.text })),
    }),
  })
  const data = await response.json().catch(() => null)
  return { response, data }
}

/**
 * Appelle l'API Anthropic directement depuis le navigateur, avec la clé
 * personnelle de l'utilisateur — usage individuel, sans backend.
 */
export async function askAssistant(
  apiKey: string,
  history: ChatMessage[],
  system: string,
): Promise<AssistantReply> {
  let lastError: AnthropicError = new AnthropicError('Réponse vide')

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const { response, data } = await callOnce(apiKey, history, system)

    if (response.ok) {
      const block = Array.isArray(data?.content)
        ? data.content.find((entry: { type?: string }) => entry.type === 'text')
        : null
      const text = block?.text
      if (typeof text === 'string' && text) {
        const inputTokens = Number(data?.usage?.input_tokens) || 0
        const outputTokens = Number(data?.usage?.output_tokens) || 0
        return { text, costUsd: estimateCost(inputTokens, outputTokens) }
      }
      lastError = new AnthropicError('Réponse vide')
    } else {
      lastError = new AnthropicError(data?.error?.message ?? `HTTP ${response.status}`)
      if (response.status !== 429 && response.status !== 529) throw lastError
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }

  throw lastError
}
