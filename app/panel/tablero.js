'use client'

import { MONTHS, STATUSES } from '@/lib/constants'

// El contador del mes, leído como el cuadro de instrumentos de una moto:
// cuatro lecturas y una barra donde cada segmento es una pieza del mes.
export default function Tablero({ posts, year, monthIndex, onPrev, onNext, onToday }) {
  const cuenta = {
    borrador: 0,
    en_revision: 0,
    aprobado: 0,
    rechazado: 0,
  }

  posts.forEach((p) => {
    if (cuenta[p.status] !== undefined) cuenta[p.status] += 1
  })

  const lecturas = [
    { key: 'aprobado', nombre: 'Aprobadas', color: 'var(--verde)' },
    { key: 'en_revision', nombre: 'Pendientes', color: 'var(--ambar)' },
    { key: 'rechazado', nombre: 'Rechazadas', color: 'var(--rojo-vivo)' },
    { key: 'borrador', nombre: 'Borradores', color: 'var(--humo)' },
  ]

  // Los segmentos van ordenados por estado para que la barra se lea de un vistazo.
  const orden = ['aprobado', 'en_revision', 'rechazado', 'borrador']
  const segmentos = []
  orden.forEach((estado) => {
    const color = STATUSES.find((s) => s.value === estado).lamp
    for (let i = 0; i < cuenta[estado]; i++) segmentos.push(color)
  })

  return (
    <section className="tablero">
      <div className="tablero-cabecera">
        <div className="tablero-mes">
          {MONTHS[monthIndex]} <span>{year}</span>
        </div>

        <div className="nav-mes">
          <button type="button" onClick={onPrev} aria-label="Mes anterior">
            ‹
          </button>
          <button type="button" onClick={onNext} aria-label="Mes siguiente">
            ›
          </button>
        </div>

        <button className="btn btn-sm" type="button" onClick={onToday}>
          Hoy
        </button>

        <div style={{ marginLeft: 'auto' }} className="eyebrow">
          {posts.length} {posts.length === 1 ? 'pieza este mes' : 'piezas este mes'}
        </div>
      </div>

      <div className="lecturas">
        {lecturas.map((l) => (
          <div className="lectura" key={l.key}>
            <div className="cifra" style={{ color: l.color }}>
              {String(cuenta[l.key]).padStart(2, '0')}
            </div>
            <div className="nombre">
              <span className="luz" style={{ background: l.color }} />
              {l.nombre}
            </div>
          </div>
        ))}
      </div>

      {segmentos.length > 0 ? (
        <div className="zona-roja" aria-hidden="true">
          {segmentos.map((color, i) => (
            <i key={i} style={{ background: color }} />
          ))}
        </div>
      ) : (
        <div className="zona-roja-vacia">Todavía no hay contenido cargado para este mes.</div>
      )}
    </section>
  )
}
