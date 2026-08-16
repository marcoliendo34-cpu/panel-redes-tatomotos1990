// Redes sociales disponibles. Los valores tienen que coincidir
// exactamente con el tipo `social_network` de la base de datos.
export const NETWORKS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'x', label: 'X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

export const NETWORK_LABEL = NETWORKS.reduce((acc, n) => {
  acc[n.value] = n.label
  return acc
}, {})

// Estados de una pieza. `lamp` es el color del testigo, como en un tablero.
export const STATUSES = [
  { value: 'borrador', label: 'Borrador', lamp: 'var(--humo)' },
  { value: 'en_revision', label: 'En revisión', lamp: 'var(--ambar)' },
  { value: 'aprobado', label: 'Aprobado', lamp: 'var(--verde)' },
  { value: 'rechazado', label: 'Rechazado', lamp: 'var(--rojo-vivo)' },
]

export const STATUS_LABEL = STATUSES.reduce((acc, s) => {
  acc[s.value] = s.label
  return acc
}, {})

export const STATUS_LAMP = STATUSES.reduce((acc, s) => {
  acc[s.value] = s.lamp
  return acc
}, {})

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// La semana arranca en lunes.
export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const pad = (n) => String(n).padStart(2, '0')

// Convierte una fecha de la base de datos al formato que entiende
// el campo <input type="datetime-local">, en hora local.
export function toLocalInput(value) {
  const d = value ? new Date(value) : new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalInput(value) {
  return new Date(value).toISOString()
}

export function formatDateTime(value) {
  const d = new Date(value)
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatLongDate(value) {
  const d = new Date(value)
  return `${WEEKDAYS[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Devuelve una matriz de semanas (6 filas x 7 días) para pintar el calendario.
export function buildMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1)
  const offset = (first.getDay() + 6) % 7 // lunes = 0
  const start = new Date(year, monthIndex, 1 - offset)

  const weeks = []
  for (let w = 0; w < 6; w++) {
    const days = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d)
      days.push(date)
    }
    weeks.push(days)
  }
  return weeks
}

export function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
