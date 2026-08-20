import type { ChatMessage } from './types'

const API_URL = 'https://api.anthropic.com/v1/messages'
/** Haiku 4.5 : le moins cher des modèles Claude actuels, cohérent avec un plafond de dépense serré. */
const MODEL = 'claude-haiku-4-5-20251001'
/**
 * Garde-fou plutôt qu'une cible : le système prompt demande déjà des
 * réponses brèves. Doit rester assez haut pour laisser le bloc <meals>
 * se terminer même quand l'utilisateur demande de journaliser plusieurs
 * repas détaillés d'un coup (à 400, le JSON coupé net s'affichait en
 * clair, faute de balise fermante à trouver) — le texte visible, lui,
 * reste court grâce au system prompt.
 */
const MAX_TOKENS = 1200

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

/** Un aller-retour d'outil coûte un appel API en plus : borné pour éviter qu'un modèle boucle. */
const MAX_TOOL_ROUNDS = 2

export class AnthropicError extends Error {}

export interface AssistantReply {
  text: string
  /** Coût estimé de l'échange (tous les appels d'outils inclus), à partir des tokens facturés renvoyés par l'API. */
  costUsd: number
}

export interface AnthropicTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

/** Exécute un outil demandé par le modèle et renvoie le texte à lui renvoyer comme résultat. */
export type ToolExecutor = (name: string, input: Record<string, unknown>) => string

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | Record<string, unknown>[]
}

async function callOnce(apiKey: string, messages: AnthropicMessage[], system: string, tools?: AnthropicTool[]) {
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
      messages,
      ...(tools && tools.length > 0 ? { tools } : {}),
    }),
  })
  const data = await response.json().catch(() => null)
  return { response, data }
}

async function callWithRetries(apiKey: string, messages: AnthropicMessage[], system: string, tools?: AnthropicTool[]) {
  let lastError: AnthropicError = new AnthropicError('Réponse vide')

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const { response, data } = await callOnce(apiKey, messages, system, tools)

    if (response.ok) return data as { content?: Record<string, unknown>[]; usage?: { input_tokens?: number; output_tokens?: number } }

    lastError = new AnthropicError(data?.error?.message ?? `HTTP ${response.status}`)
    if (response.status !== 429 && response.status !== 529) throw lastError

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }

  throw lastError
}

/**
 * Appelle l'API Anthropic directement depuis le navigateur, avec la clé
 * personnelle de l'utilisateur — usage individuel, sans backend. Si le
 * modèle demande un outil, l'exécute via `executeTool` et relance l'appel
 * avec le résultat, jusqu'à MAX_TOOL_ROUNDS allers-retours.
 */
export async function askAssistant(
  apiKey: string,
  history: ChatMessage[],
  system: string,
  tools?: AnthropicTool[],
  executeTool?: ToolExecutor,
): Promise<AssistantReply> {
  const messages: AnthropicMessage[] = history.map((message) => ({ role: message.role, content: message.text }))
  let inputTokens = 0
  let outputTokens = 0

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const data = await callWithRetries(apiKey, messages, system, tools)
    inputTokens += Number(data?.usage?.input_tokens) || 0
    outputTokens += Number(data?.usage?.output_tokens) || 0

    const content = Array.isArray(data?.content) ? data.content : []
    const toolUses = content.filter((block) => block.type === 'tool_use')

    if (toolUses.length > 0 && executeTool && round < MAX_TOOL_ROUNDS) {
      messages.push({ role: 'assistant', content })
      messages.push({
        role: 'user',
        content: toolUses.map((block) => ({
          type: 'tool_result',
          tool_use_id: block.id,
          content: executeTool(String(block.name), (block.input as Record<string, unknown>) ?? {}),
        })),
      })
      continue
    }

    const textBlock = content.find((block) => block.type === 'text')
    const text = textBlock?.text
    if (typeof text === 'string' && text) {
      return { text, costUsd: estimateCost(inputTokens, outputTokens) }
    }
    throw new AnthropicError('Réponse vide')
  }

  throw new AnthropicError("Trop d'appels d'outils")
}
