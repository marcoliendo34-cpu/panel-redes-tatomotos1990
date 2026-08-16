import { createBrowserClient } from '@supabase/ssr'

// Cliente de Supabase que se usa desde el navegador (componentes con "use client").
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
