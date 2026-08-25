'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  redesTexto,
  STATUS_LABEL,
  STATUS_LAMP,
  formatLongDate,
} from '@/lib/constants'

export default function Detalle({
  post,
  profile,
  marcaNombre,
  onClose,
  onChanged,
  onEdit,
  onDelete,
}) {
  const supabase = useMemo(() => createClient(), [])
  const esAgencia = profile.role === 'agencia'

  const [comentarios, setComentarios] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [modoRechazo, setModoRechazo] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState('')

  const cargarComentarios = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('id, body, kind, author_name, author_role, created_at')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComentarios(data || [])
  }, [post.id, supabase])

  useEffect(() => {
    cargarComentarios()
  }, [cargarComentarios])

  useEffect(() => {
    function esc(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  async function revisar(accion) {
    setError('')

    if (accion === 'rechazar' && !mensaje.trim()) {
      setError('Escribe el motivo del rechazo para que el equipo sepa qué corregir.')
      return
    }
    if (accion === 'comentar' && !mensaje.trim()) {
      setError('Escribe algo antes de enviar el comentario.')
      return
    }

    setTrabajando(true)
    const { error: err } = await supabase.rpc('review_post', {
      p_post_id: post.id,
      p_action: accion,
      p_message: mensaje.trim() || null,
    })
    setTrabajando(false)

    if (err) {
      setError(err.message)
      return
    }

    setMensaje('')
    setModoRechazo(false)
    await cargarComentarios()
    await onChanged()
  }

  async function enviarARevision() {
    setTrabajando(true)
    const { error: err } = await supabase
      .from('posts')
      .update({ status: 'en_revision' })
      .eq('id', post.id)
    setTrabajando(false)
    if (err) {
      setError(err.message)
      return
    }
    await onChanged()
  }

  return (
    <div className="telon" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={post.title}>
        <div className="modal-cabecera">
          <h2>{post.title}</h2>
          <span className="testigo" style={{ color: STATUS_LAMP[post.status] }}>
            <span className="luz" />
            <span style={{ color: 'var(--cromo)' }}>{STATUS_LABEL[post.status]}</span>
          </span>
          <button className="cerrar" type="button" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modal-cuerpo">
          <div className="modal-media">
            {post.vista_url && post.media_type === 'video' ? (
              <video src={post.vista_url} controls playsInline />
            ) : post.vista_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.vista_url} alt={post.title} />
            ) : (
              <div className="sin-media">Esta pieza todavía no tiene arte cargado.</div>
            )}
          </div>

          <div>
            <div className="datos">
              {marcaNombre ? (
                <div className="dato">
                  <div className="k">Cliente</div>
                  <div className="v">{marcaNombre}</div>
                </div>
              ) : null}
              <div className="dato">
                <div className="k">Redes</div>
                <div className="v">{redesTexto(post)}</div>
              </div>
              <div className="dato">
                <div className="k">Publicación</div>
                <div className="v">{formatLongDate(post.scheduled_at)}</div>
              </div>
            </div>

            <div className="etiqueta">Copy</div>
            <div className="copy-caja">{post.copy || 'Sin copy todavía.'}</div>

            {post.status === 'rechazado' && post.rejection_reason ? (
              <div className="motivo">
                <div className="k">Motivo del rechazo</div>
                <div className="v">{post.rejection_reason}</div>
              </div>
            ) : null}

            {esAgencia ? (
              <div className="acciones">
                <button className="btn btn-sm" type="button" onClick={() => onEdit(post)}>
                  Editar pieza
                </button>
                {post.status === 'borrador' ? (
                  <button
                    className="btn btn-sm btn-primario"
                    type="button"
                    onClick={enviarARevision}
                    disabled={trabajando}
                  >
                    Enviar a revisión
                  </button>
                ) : null}
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => onDelete(post)}
                  style={{ marginLeft: 'auto', color: 'var(--humo)' }}
                >
                  Eliminar
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="hilo">
          <h3>Conversación</h3>

          {comentarios.length === 0 ? (
            <p className="sin-mensajes">
              Todavía nadie ha comentado esta pieza.
            </p>
          ) : (
            <div className="mensajes">
              {comentarios.map((c) => (
                <div
                  className={`mensaje ${
                    c.author_role === 'agencia' ? 'de-agencia' : 'de-cliente'
                  }`}
                  key={c.id}
                >
                  <div className="quien">
                    <b>{c.author_name || 'Usuario'}</b>
                    <time>
                      {new Date(c.created_at).toLocaleString('es', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    {c.kind === 'rechazo' ? (
                      <span className="testigo" style={{ color: 'var(--rojo-vivo)' }}>
                        <span className="luz" />
                        <span style={{ color: 'var(--cromo)' }}>Rechazo</span>
                      </span>
                    ) : null}
                    {c.kind === 'aprobacion' ? (
                      <span className="testigo" style={{ color: 'var(--verde)' }}>
                        <span className="luz" />
                        <span style={{ color: 'var(--cromo)' }}>Aprobación</span>
                      </span>
                    ) : null}
                  </div>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          )}

          {post.status === 'borrador' && !esAgencia ? (
            <p className="sin-mensajes">
              Esta pieza aún no está lista para revisión.
            </p>
          ) : (
            <>
              <label className="etiqueta" htmlFor="mensaje">
                {modoRechazo ? 'Motivo del rechazo (obligatorio)' : 'Escribe un comentario'}
              </label>
              <textarea
                id="mensaje"
                className="campo"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder={
                  modoRechazo
                    ? 'Ej.: cambiar el precio, la moto de la foto no es la del modelo…'
                    : 'Ej.: cambiemos el primer párrafo por algo más corto.'
                }
                style={{ minHeight: 88 }}
              />

              {error ? (
                <div className="aviso aviso-error" style={{ marginTop: 12 }}>
                  {error}
                </div>
              ) : null}

              <div className="acciones">
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => revisar('comentar')}
                  disabled={trabajando}
                >
                  Enviar comentario
                </button>

                {post.status !== 'aprobado' ? (
                  <button
                    className="btn btn-sm btn-verde"
                    type="button"
                    onClick={() => revisar('aprobar')}
                    disabled={trabajando}
                  >
                    Aprobar
                  </button>
                ) : null}

                {post.status !== 'rechazado' ? (
                  <button
                    className="btn btn-sm btn-rechazo"
                    type="button"
                    onClick={() => {
                      if (!modoRechazo) {
                        setModoRechazo(true)
                        setError('')
                        return
                      }
                      revisar('rechazar')
                    }}
                    disabled={trabajando}
                  >
                    {modoRechazo ? 'Confirmar rechazo' : 'Rechazar'}
                  </button>
                ) : null}

                {modoRechazo ? (
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() => {
                      setModoRechazo(false)
                      setError('')
                    }}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
