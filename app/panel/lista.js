'use client'

import {
  redesTexto,
  STATUS_LABEL,
  STATUS_LAMP,
  formatDateTime,
} from '@/lib/constants'

export default function Lista({ posts, onOpen, nombreDeMarca }) {
  const ordenadas = [...posts].sort(
    (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)
  )

  return (
    <div className="lista">
      {ordenadas.map((p) => (
        <button
          type="button"
          className="fila"
          key={p.id}
          onClick={() => onOpen(p)}
          style={{ borderLeftColor: STATUS_LAMP[p.status] }}
        >
          {p.vista_url && p.media_type === 'imagen' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="foto" src={p.vista_url} alt="" />
          ) : (
            <span className="foto-vacia">
              {p.media_type === 'video' ? 'Video' : 'Sin arte'}
            </span>
          )}

          <span className="cuerpo">
            {nombreDeMarca && nombreDeMarca(p.brand_id) ? (
              <span className="de-quien">{nombreDeMarca(p.brand_id)}</span>
            ) : null}
            <span className="titulo">{p.title}</span>
            <span className="copy">{p.copy || 'Sin copy todavía.'}</span>
          </span>

          <span className="lado">
            <span className="testigo" style={{ color: STATUS_LAMP[p.status] }}>
              <span className="luz" />
              <span style={{ color: 'var(--cromo)' }}>{STATUS_LABEL[p.status]}</span>
            </span>
            <span className="cuando">
              {redesTexto(p)} · {formatDateTime(p.scheduled_at)}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
