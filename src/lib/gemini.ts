import type { ChatMessage } from './types'

/**
 * Alias auto-mis à jour par Google vers le dernier modèle Flash — celui du
 * palier gratuit de l'API Gemini, sans carte bancaire requise.
 */
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

export class GeminiError extends Error {}

/**
 * Appelle l'API Gemini directement depuis le navigateur, avec la clé
 * personnelle de l'utilisateur — palier gratuit chez Google, cohérent avec
 * un usage individuel sans backend.
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
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: history.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.text }],
      })),
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new GeminiError(data?.error?.message ?? `HTTP ${response.status}`)
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string' || !text) throw new GeminiError('Réponse vide')
  return text
}
