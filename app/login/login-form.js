'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setCargando(false)
      setError(
        error.message === 'Invalid login credentials'
          ? 'El correo o la contraseña no coinciden. Revísalos e intenta otra vez.'
          : error.message
      )
      return
    }

    router.replace('/panel')
    router.refresh()
  }

  return (
    <form className="login-form" onSubmit={entrar}>
      <div>
        <label className="etiqueta" htmlFor="email">
          Correo
        </label>
        <input
          id="email"
          className="campo"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          className="campo"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error ? <div className="aviso aviso-error">{error}</div> : null}

      <button className="btn btn-primario" type="submit" disabled={cargando}>
        {cargando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
