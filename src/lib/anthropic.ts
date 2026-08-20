import type { ChatMessage } from './types'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 1024

export class AnthropicError extends Error {}

/**
 * Appelle l'API Anthropic directement depuis le navigateur, avec la clé
 * personnelle de l'utilisateur. Le header « dangereux » est celui
 * qu'Anthropic exige pour ce cas précis : un usage individuel, où
 * l'utilisateur est propriétaire de sa propre clé et l'envoie lui-même.
 */
export async function askAssistant(
  apiKey: string,
  history: ChatMessage[],
  system: string,
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
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

  if (!response.ok) {
    throw new AnthropicError(data?.error?.message ?? `HTTP ${response.status}`)
  }

  const block = Array.isArray(data?.content)
    ? data.content.find((entry: { type?: string }) => entry.type === 'text')
    : null
  const text = block?.text
  if (typeof text !== 'string' || !text) throw new AnthropicError('Réponse vide')
  return text
}
