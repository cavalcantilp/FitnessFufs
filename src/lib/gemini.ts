import type { ChatMessage } from './types'

/**
 * Alias auto-mis à jour par Google vers le dernier modèle Flash — celui du
 * palier gratuit de l'API Gemini, sans carte bancaire requise.
 */
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

/**
 * Le palier gratuit du dernier modèle Flash est sujet à des 503 en cas de
 * pic de charge — Google qualifie lui-même ces épisodes de « généralement
 * temporaires » dans le message d'erreur. Deux relances suffisent en
 * pratique à passer un pic passager sans faire attendre indéfiniment.
 */
const RETRY_DELAYS_MS = [1500, 3000]

export class GeminiError extends Error {}

async function callOnce(apiKey: string, history: ChatMessage[], system: string) {
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
  return { response, data }
}

/**
 * Appelle l'API Gemini directement depuis le navigateur, avec la clé
 * personnelle de l'utilisateur — palier gratuit chez Google, cohérent avec
 * un usage individuel sans backend. Relance automatiquement sur une
 * surcharge temporaire (503) ou une limite de débit (429) ; toute autre
 * erreur (clé invalide, requête malformée) échoue immédiatement puisqu'une
 * relance n'y changerait rien.
 */
export async function askAssistant(
  apiKey: string,
  history: ChatMessage[],
  system: string,
): Promise<string> {
  let lastError: GeminiError = new GeminiError('Réponse vide')

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const { response, data } = await callOnce(apiKey, history, system)

    if (response.ok) {
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (typeof text === 'string' && text) return text
      lastError = new GeminiError('Réponse vide')
    } else {
      lastError = new GeminiError(data?.error?.message ?? `HTTP ${response.status}`)
      if (response.status !== 503 && response.status !== 429) throw lastError
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }

  throw lastError
}
