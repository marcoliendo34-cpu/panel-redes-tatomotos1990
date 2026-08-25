'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  NETWORKS,
  STATUSES,
  toLocalInput,
  fromLocalInput,
} from '@/lib/constants'

const BUCKET = 'contenido'

export default function Editor({
  post,
  profile,
  brands,
  marcaPorDefecto,
  onClose,
  onSaved,
}) {
  const supabase = useMemo(() => createClient(), [])
  const esNueva = !post

  const brandInicial =
    post?.brand_id ||
    marcaPorDefecto ||
    profile.brand_id ||
    (brands[0] ? brands[0].id : null)

  const [form, setForm] = useState({
    brand_id: brandInicial,
    title: post?.title || '',
    copy: post?.copy || '',
    networks:
      Array.isArray(post?.networks) && post.networks.length > 0
        ? post.networks
        : post?.network
          ? [post.network]
          : ['instagram'],
    status: post?.status || 'borrador',
    scheduled_at: toLocalInput(post?.scheduled_at),
    media_path: post?.media_path || '',
    media_type: post?.media_type || null,
  })

  // Enlace temporal solo para ver la vista previa aquí dentro.
  // Nunca se guarda en la base de datos: caduca en una hora.
  const [vistaPrevia, setVistaPrevia] = useState(post?.vista_url || '')

  const [subiendo, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function esc(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  // Marca o desmarca una red. Nunca deja la lista vacía: si intentas
  // quitar la última, se queda puesta.
  function alternarRed(valor) {
    setForm((f) => {
      const puesta = f.networks.includes(valor)
      if (puesta && f.networks.length === 1) return f
      return {
        ...f,
        networks: puesta
          ? f.networks.filter((r) => r !== valor)
          : [...f.networks, valor],
      }
    })
  }

  async function subirArchivo(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    // La carpeta decide quién puede ver el archivo, así que sin marca
    // no se sube nada: quedaría en tierra de nadie.
    if (!form.brand_id) {
      setError('Elige primero el cliente al que pertenece la pieza.')
      e.target.value = ''
      return
    }

    setError('')
    setSubiendo(true)

    const extension = (file.name.split('.').pop() || 'bin').toLowerCase()
    const nombre = `${form.brand_id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}.${extension}`

    const { error: errSubida } = await supabase.storage
      .from(BUCKET)
      .upload(nombre, file, { cacheControl: '3600', upsert: false })

    if (errSubida) {
      setSubiendo(false)
      setError(`No se pudo subir el archivo: ${errSubida.message}`)
      return
    }

    // El almacén es privado, así que pedimos un enlace temporal para la vista previa.
    const { data: firmada } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(nombre, 3600)

    setForm((f) => ({
      ...f,
      media_path: nombre,
      media_type: file.type.startsWith('video') ? 'video' : 'imagen',
    }))
    setVistaPrevia(firmada?.signedUrl || '')
    setSubiendo(false)
    e.target.value = ''
  }

  // Si se cambia de cliente con un archivo ya subido, hay que MOVERLO.
  // Si no, el archivo se queda en la carpeta del cliente anterior y los
  // permisos de lectura apuntarían a quien no debe.
  async function cambiarMarca(nuevaMarca) {
    if (!form.media_path) {
      set('brand_id', nuevaMarca)
      return
    }

    setError('')
    setSubiendo(true)

    const archivo = form.media_path.split('/').pop()
    const nuevaRuta = `${nuevaMarca}/${archivo}`

    const { error: errMover } = await supabase.storage
      .from(BUCKET)
      .move(form.media_path, nuevaRuta)

    if (errMover) {
      setSubiendo(false)
      setError(`No se pudo mover el archivo al nuevo cliente: ${errMover.message}`)
      return
    }

    const { data: firmada } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(nuevaRuta, 3600)

    setForm((f) => ({ ...f, brand_id: nuevaMarca, media_path: nuevaRuta }))
    setVistaPrevia(firmada?.signedUrl || '')
    setSubiendo(false)
  }

  async function quitarArchivo() {
    if (form.media_path) {
      await supabase.storage.from(BUCKET).remove([form.media_path])
    }
    setForm((f) => ({ ...f, media_path: '', media_type: null }))
    setVistaPrevia('')
  }

  async function guardar(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Ponle un título a la pieza para poder identificarla.')
      return
    }
    if (!form.brand_id) {
      setError('No hay ninguna marca disponible. Crea una en Supabase primero.')
      return
    }

    setGuardando(true)

    const payload = {
      brand_id: form.brand_id,
      title: form.title.trim(),
      copy: form.copy,
      networks: form.networks,
      status: form.status,
      scheduled_at: fromLocalInput(form.scheduled_at),
      // Guardamos la ruta, no el enlace: los enlaces caducan a la hora.
      media_url: null,
      media_path: form.media_path || null,
      media_type: form.media_type,
    }

    let err
    if (esNueva) {
      payload.created_by = profile.id
      const res = await supabase.from('posts').insert(payload)
      err = res.error
    } else {
      const res = await supabase.from('posts').update(payload).eq('id', post.id)
      err = res.error
    }

    setGuardando(false)

    if (err) {
      setError(err.message)
      return
    }

    await onSaved()
  }

  return (
    <div className="telon" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-cabecera">
          <h2>{esNueva ? 'Nueva pieza' : 'Editar pieza'}</h2>
          <button className="cerrar" type="button" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form className="editor" onSubmit={guardar}>
          <div className="subida">
            {vistaPrevia && form.media_type === 'imagen' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="previo" src={vistaPrevia} alt="" />
            ) : form.media_path ? (
              <span className="previo-vacio">
                {form.media_type === 'video' ? 'Video cargado' : 'Archivo cargado'}
              </span>
            ) : (
              <span className="previo-vacio">Sin arte</span>
            )}

            <div className="info">
              <p>
                Imagen o video de la pieza. Se guarda en tu Supabase, no en el
                computador de nadie.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
                  {subiendo ? 'Subiendo…' : form.media_path ? 'Cambiar archivo' : 'Subir archivo'}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={subirArchivo}
                    disabled={subiendo}
                    style={{ display: 'none' }}
                  />
                </label>
                {form.media_path ? (
                  <button className="btn btn-sm" type="button" onClick={quitarArchivo}>
                    Quitar
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <label className="etiqueta" htmlFor="titulo">
              Título
            </label>
            <input
              id="titulo"
              className="campo"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej.: Promo Bera BR-200 fin de semana"
              required
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="copy">
              Copy
            </label>
            <textarea
              id="copy"
              className="campo"
              value={form.copy}
              onChange={(e) => set('copy', e.target.value)}
              placeholder="El texto tal cual va a salir publicado, con hashtags y todo."
            />
          </div>

          <div>
            <span className="etiqueta">Redes sociales</span>
            <div className="redes-picker" role="group" aria-label="Redes sociales">
              {NETWORKS.map((n) => {
                const activa = form.networks.includes(n.value)
                return (
                  <button
                    key={n.value}
                    type="button"
                    className={`red-chip${activa ? ' activa' : ''}`}
                    aria-pressed={activa}
                    onClick={() => alternarRed(n.value)}
                  >
                    {n.label}
                  </button>
                )
              })}
            </div>
            <p className="ayuda">
              Puedes marcar varias. La pieza aparece una sola vez y el cliente la
              aprueba una sola vez.
            </p>
          </div>

          <div className="editor-fila">
            <div>
              <label className="etiqueta" htmlFor="fecha">
                Fecha y hora de publicación
              </label>
              <input
                id="fecha"
                className="campo"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => set('scheduled_at', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="editor-fila">
            <div>
              <label className="etiqueta" htmlFor="estado">
                Estado
              </label>
              <select
                id="estado"
                className="campo"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {brands.length > 1 ? (
              <div>
                <label className="etiqueta" htmlFor="marca">
                  Marca
                </label>
                <select
                  id="marca"
                  className="campo"
                  value={form.brand_id || ''}
                  onChange={(e) => cambiarMarca(e.target.value)}
                  disabled={subiendo}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {error ? <div className="aviso aviso-error">{error}</div> : null}

          <div className="editor-pie">
            <button className="btn izq" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primario" type="submit" disabled={guardando || subiendo}>
              {guardando ? 'Guardando…' : esNueva ? 'Crear pieza' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
