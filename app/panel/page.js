import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PanelClient from './panel-client'

export const dynamic = 'force-dynamic'

export default async function PanelPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, brand_id')
    .eq('id', user.id)
    .maybeSingle()

  // Si por lo que sea el perfil no existe, mostramos un mensaje claro
  // en vez de una pantalla rota.
  if (!profile) {
    return (
      <main className="app">
        <div style={{ paddingTop: 80, maxWidth: 520 }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Falta tu perfil</h1>
          <p style={{ color: 'var(--humo)', lineHeight: 1.6, fontSize: 14 }}>
            Tu usuario existe pero todavía no tiene un perfil asignado en la base de
            datos. Pídele a la agencia que te asigne un rol y una marca.
          </p>
          <form action="/auth/signout" method="post" style={{ marginTop: 22 }}>
            <button className="btn" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </main>
    )
  }

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, logo_url')
    .order('created_at')

  return (
    <PanelClient
      profile={profile}
      brands={brands || []}
      email={user.email}
    />
  )
}
