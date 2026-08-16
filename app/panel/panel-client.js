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
  // Cliente cuyo contenido se está viendo. Solo la agencia puede cambiarlo.
  const [filtroMarca, setFiltroMarca] = useState('todas')

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

    if (err) {
      setCargando(false)
      setError(`No se pudo cargar el contenido: ${err.message}`)
      setPosts([])
      return
    }

    const filas = data || []

    // El almacén es privado: cada imagen necesita un enlace temporal
    // (1 hora) que solo funciona para quien tiene permiso de verla.
    const rutas = filas.map((p) => p.media_path).filter(Boolean)
    const mapaUrls = {}

    if (rutas.length > 0) {
      const { data: firmadas } = await supabase.storage
        .from('contenido')
        .createSignedUrls(rutas, 3600)

      if (firmadas) {
        firmadas.forEach((f) => {
          if (f.signedUrl && !f.error) mapaUrls[f.path] = f.signedUrl
        })
      }
    }

    const conVista = filas.map((p) => ({
      ...p,
      vista_url: p.media_path ? mapaUrls[p.media_path] || null : null,
    }))

    setCargando(false)
    setPosts(conVista)

    // Si hay una pieza abierta, la refrescamos con los datos nuevos.
    setSeleccionada((actual) => {
      if (!actual) return null
      return conVista.find((p) => p.id === actual.id) || null
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

  // El filtro de marca solo aplica a la agencia. Un cliente ya viene
  // limitado a su marca por la base de datos, no por esta pantalla.
  const porMarca = esAgencia && filtroMarca !== 'todas'
    ? posts.filter((p) => p.brand_id === filtroMarca)
    : posts

  const visibles = porMarca.filter((p) => {
    if (filtroEstado !== 'todos' && p.status !== filtroEstado) return false
    if (filtroRed !== 'todas' && p.network !== filtroRed) return false
    return true
  })

  const nombreDeMarca = (id) => {
    const b = brands.find((x) => x.id === id)
    return b ? b.name : null
  }

  // Nombre y logo del cliente que aparecen junto a la marca de la agencia.
  const marcaEnCabecera = (() => {
    const porId = (id) => brands.find((x) => x.id === id) || null
    if (!esAgencia) return porId(profile.brand_id)
    if (filtroMarca !== 'todas') return porId(filtroMarca)
    return brands.length === 1 ? brands[0] : null
  })()

  const marcaActual = marcaEnCabecera
    ? marcaEnCabecera.name
    : esAgencia
      ? 'Todos los clientes'
      : null

  // Cuando se ven varias marcas a la vez, cada pieza necesita decir de quién es.
  const mostrarMarcaEnPiezas = esAgencia && filtroMarca === 'todas' && brands.length > 1

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
          {marcaActual ? (
            <div className="marca-gestionada">
              {marcaEnCabecera && marcaEnCabecera.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={marcaEnCabecera.logo_url} alt="" className="logo-cliente" />
              ) : null}
              <span>{marcaActual}</span>
            </div>
          ) : null}
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
        posts={porMarca}
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
          {esAgencia && brands.length > 1 ? (
            <select
              className="campo campo-marca"
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
              aria-label="Filtrar por cliente"
            >
              <option value="todas">Todos los clientes</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : null}

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
        <Lista
          posts={visibles}
          onOpen={setSeleccionada}
          nombreDeMarca={mostrarMarcaEnPiezas ? nombreDeMarca : null}
        />
      )}

      {seleccionada ? (
        <Detalle
          post={seleccionada}
          profile={profile}
          marcaNombre={
            esAgencia && brands.length > 1 ? nombreDeMarca(seleccionada.brand_id) : null
          }
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
          marcaPorDefecto={filtroMarca !== 'todas' ? filtroMarca : null}
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
