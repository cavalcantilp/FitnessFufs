/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL du projet Supabase — absente tant que le compte n'est pas configuré. */
  readonly VITE_SUPABASE_URL?: string
  /** Clé publique « anon » Supabase, protégée par les policies RLS côté serveur. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
