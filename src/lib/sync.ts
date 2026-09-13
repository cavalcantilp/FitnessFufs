import { getSupabase } from './supabase'
import type { ExportPayload } from '../state/AppContext'

const TABLE = 'user_data'

interface UserDataRow {
  data: ExportPayload
}

/** Dernier état connu du cloud pour ce compte — null si jamais synchronisé (compte flambant neuf). */
export async function pullSyncedState(userId: string): Promise<ExportPayload | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle<UserDataRow>()
  if (error) throw error
  return data?.data ?? null
}

/** Écrase la ligne du compte avec l'état local courant — dernier écrit gagne, suffisant pour un usage mono-utilisateur multi-appareils. */
export async function pushSyncedState(userId: string, payload: ExportPayload): Promise<void> {
  const { error } = await getSupabase()
    .from(TABLE)
    .upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() })
  if (error) throw error
}
