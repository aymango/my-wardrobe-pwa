import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are missing. Copy .env.example to .env and fill in the values.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
)

export const STORAGE_BUCKET = (import.meta.env.VITE_STORAGE_BUCKET as string | undefined) || 'wardrobe-private'
export const ALLOWED_EMAIL = (import.meta.env.VITE_ALLOWED_EMAIL as string | undefined)?.trim().toLowerCase() || ''
