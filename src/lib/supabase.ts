import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Tant que le projet Supabase n'est pas configuré (clés absentes du build), le compte reste invisible : l'app continue de fonctionner en local, comme avant. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

const REMEMBER_KEY = 'mff.rememberMe'

export function getRememberMe(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== 'false'
  } catch {
    return true
  }
}

/**
 * Change où la session Supabase est gardée : localStorage (survit à la fermeture
 * de l'app) ou sessionStorage (oubliée dès que l'onglet/l'app est fermé — vide au
 * prochain lancement d'une PWA, ce qui correspond exactement à « ne pas se
 * souvenir de moi »). N'a d'effet que pour la PROCHAINE connexion : à appeler
 * avant signIn, jamais sur une session déjà active.
 */
export function setRememberMe(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_KEY, String(remember))
  } catch {
    // Rien à faire.
  }
  client = null
}

let client: SupabaseClient | null = null

/** Client paresseux : construit au premier appel, avec le stockage de session choisi à cet instant. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase non configuré')
  }
  if (!client) {
    client = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: getRememberMe() ? window.localStorage : window.sessionStorage,
      },
    })
  }
  return client
}
