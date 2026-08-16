'use client'

import {
  WEEKDAYS,
  NETWORK_LABEL,
  STATUS_LAMP,
  buildMonthGrid,
  sameDay,
} from '@/lib/constants'

export default function Calendario({ posts, year, monthIndex, onOpen }) {
  const semanas = buildMonthGrid(year, monthIndex)
  const hoy = new Date()

  function piezasDe(date) {
    return posts
      .filter((p) => sameDay(new Date(p.scheduled_at), date))
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
  }

  return (
    <div className="cal-scroll">
      <div className="cal">
        <div className="cal-cabecera">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {semanas.map((semana, wi) => (
          <div className="cal-semana" key={wi}>
            {semana.map((date) => {
              const fuera = date.getMonth() !== monthIndex
              const esHoy = sameDay(date, hoy)
              const piezas = piezasDe(date)

              return (
                <div
                  className={`cal-dia${fuera ? ' fuera' : ''}${esHoy ? ' hoy' : ''}`}
                  key={date.toISOString()}
                >
                  <div className="cal-num">{date.getDate()}</div>

                  {piezas.map((p) => (
                    <button
                      type="button"
                      className="chip"
                      key={p.id}
                      onClick={() => onOpen(p)}
                      style={{ borderLeftColor: STATUS_LAMP[p.status] }}
                    >
                      {p.vista_url && p.media_type === 'imagen' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="mini" src={p.vista_url} alt="" />
                      ) : (
                        <span className="mini-vacio" />
                      )}
                      <span className="texto">
                        <span className="titulo">{p.title}</span>
                        <span className="meta">
                          {new Date(p.scheduled_at).toLocaleTimeString('es', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' · '}
                          {NETWORK_LABEL[p.network] || p.network}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
