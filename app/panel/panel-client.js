'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NETWORKS, STATUSES } from '@/lib/constants'
import Tablero from './tablero'
import Calendario from './calendario'
import Lista from './lista'
import Detalle from './detalle'
import Editor from './editor'

export default function PanelClient({ profile, brands, email }) {
  // Se crea una sola vez: si se recreara en cada render, el useEffect
  // de abajo se dispararía sin parar.
  const supabase = useMemo(() => createClient(), [])
  const esAgencia = profile.role === 'agencia'

  const hoy = new Date()
  const [year, setYear] = useState(hoy.getFullYear())
  const [monthIndex, setMonthIndex] = useState(hoy.getMonth())

  const [vista, setVista] = useState('calendario')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroRed, setFiltroRed] = useState('todas')

  const [posts, setPosts] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [seleccionada, setSeleccionada] = useState(null)
  const [editando, setEditando] = useState(null) // null | 'nueva' | objeto pieza

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')

    const desde = new Date(year, monthIndex, 1)
    const hasta = new Date(year, monthIndex + 1, 1)

    const { data, error: err } = await supabase
      .from('posts')
      .select('*')
      .gte('scheduled_at', desde.toISOString())
      .lt('scheduled_at', hasta.toISOString())
      .order('scheduled_at', { ascending: true })

    setCargando(false)

    if (err) {
      setError(`No se pudo cargar el contenido: ${err.message}`)
      setPosts([])
      return
    }

    setPosts(data || [])

    // Si hay una pieza abierta, la refrescamos con los datos nuevos.
    setSeleccionada((actual) => {
      if (!actual) return null
      return (data || []).find((p) => p.id === actual.id) || null
    })
  }, [year, monthIndex, supabase])

  useEffect(() => {
    cargar()
  }, [cargar])

  function mesAnterior() {
    if (monthIndex === 0) {
      setYear((y) => y - 1)
      setMonthIndex(11)
    } else {
      setMonthIndex((m) => m - 1)
    }
  }

  function mesSiguiente() {
    if (monthIndex === 11) {
      setYear((y) => y + 1)
      setMonthIndex(0)
    } else {
      setMonthIndex((m) => m + 1)
    }
  }

  function irAHoy() {
    const d = new Date()
    setYear(d.getFullYear())
    setMonthIndex(d.getMonth())
  }

  async function eliminar(post) {
    const seguro = window.confirm(
      `¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`
    )
    if (!seguro) return

    if (post.media_path) {
      await supabase.storage.from('contenido').remove([post.media_path])
    }
    const { error: err } = await supabase.from('posts').delete().eq('id', post.id)
    if (err) {
      setError(err.message)
      return
    }
    setSeleccionada(null)
    await cargar()
  }

  const visibles = posts.filter((p) => {
    if (filtroEstado !== 'todos' && p.status !== filtroEstado) return false
    if (filtroRed !== 'todas' && p.network !== filtroRed) return false
    return true
  })

  // Nombre de la marca cuyo contenido se está viendo, para mostrarlo
  // junto al logo de la agencia.
  const marcaActual = (() => {
    if (profile.brand_id) {
      const b = brands.find((x) => x.id === profile.brand_id)
      if (b) return b.name
    }
    return brands.length === 1 ? brands[0].name : null
  })()

  return (
    <main className="app">
      <header className="barra">
        <div className="barra-marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-marco.png" alt="Marco Liendo · Gestión RRSS" />
          <div>
            <div className="nombre">Marco Liendo</div>
            <div className="sub">Gestión RRSS</div>
          </div>
          {marcaActual ? <div className="marca-gestionada">{marcaActual}</div> : null}
        </div>

        <div className="barra-derecha">
          <div className="usuario">
            <div className="quien">{profile.full_name || email}</div>
            <div className="rol">{esAgencia ? 'Agencia' : 'Cliente'}</div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="btn btn-sm" type="submit">
              Salir
            </button>
          </form>
        </div>
      </header>

      <Tablero
        posts={posts}
        year={year}
        monthIndex={monthIndex}
        onPrev={mesAnterior}
        onNext={mesSiguiente}
        onToday={irAHoy}
      />

      <div className="controles">
        <div className="conmutador">
          <button
            type="button"
            className={vista === 'calendario' ? 'activo' : ''}
            onClick={() => setVista('calendario')}
          >
            Calendario
          </button>
          <button
            type="button"
            className={vista === 'lista' ? 'activo' : ''}
            onClick={() => setVista('lista')}
          >
            Lista
          </button>
        </div>

        {esAgencia ? (
          <button
            className="btn btn-primario btn-sm"
            type="button"
            onClick={() => setEditando('nueva')}
          >
            + Nueva pieza
          </button>
        ) : null}

        <div className="filtros">
          <select
            className="campo"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="todos">Todos los estados</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            className="campo"
            value={filtroRed}
            onChange={(e) => setFiltroRed(e.target.value)}
            aria-label="Filtrar por red social"
          >
            <option value="todas">Todas las redes</option>
            {NETWORKS.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="aviso aviso-error" style={{ marginBottom: 18 }}>
          {error}
        </div>
      ) : null}

      {cargando ? (
        <div className="vacio">
          <p style={{ margin: 0 }}>Cargando el contenido del mes…</p>
        </div>
      ) : visibles.length === 0 ? (
        <div className="vacio">
          <h3>No hay piezas para mostrar</h3>
          <p>
            {posts.length === 0
              ? esAgencia
                ? 'Este mes está vacío. Crea la primera pieza para que el cliente pueda revisarla.'
                : 'La agencia todavía no ha cargado contenido para este mes.'
              : 'Ninguna pieza coincide con los filtros que elegiste.'}
          </p>
          {esAgencia && posts.length === 0 ? (
            <button
              className="btn btn-primario"
              type="button"
              onClick={() => setEditando('nueva')}
            >
              Crear la primera pieza
            </button>
          ) : null}
        </div>
      ) : vista === 'calendario' ? (
        <Calendario
          posts={visibles}
          year={year}
          monthIndex={monthIndex}
          onOpen={setSeleccionada}
        />
      ) : (
        <Lista posts={visibles} onOpen={setSeleccionada} />
      )}

      {seleccionada ? (
        <Detalle
          post={seleccionada}
          profile={profile}
          onClose={() => setSeleccionada(null)}
          onChanged={cargar}
          onEdit={(p) => {
            setSeleccionada(null)
            setEditando(p)
          }}
          onDelete={eliminar}
        />
      ) : null}

      {editando ? (
        <Editor
          post={editando === 'nueva' ? null : editando}
          profile={profile}
          brands={brands}
          onClose={() => setEditando(null)}
          onSaved={async () => {
            setEditando(null)
            await cargar()
          }}
        />
      ) : null}
    </main>
  )
}
