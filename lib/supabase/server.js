import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente de Supabase que se usa en el servidor (páginas y rutas).
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ocurre al llamarse desde un Server Component.
            // El middleware ya se encarga de refrescar la sesión, así que no pasa nada.
          }
        },
      },
    }
  )
}
