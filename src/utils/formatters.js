/**
 * Formateo y parsing de bolívares.
 * Locale: es-VE — usa "." como separador de miles (estilo venezolano).
 *
 *   formatBolivares(1500000)     → "1.500.000"
 *   formatBolivares("1500000")   → "1.500.000"
 *   formatBolivares("")          → ""
 *   parseBolivares("1.500.000")  → 1500000
 *   parseBolivares("abc")        → 0
 */

const bolivaresFormatter = new Intl.NumberFormat('es-VE', {
  maximumFractionDigits: 0,
  useGrouping: true
})

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function formatBolivares(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10)
  if (!Number.isFinite(num)) return ''
  return bolivaresFormatter.format(num)
}

export function parseBolivares(str) {
  const digits = String(str ?? '').replace(/\D/g, '')
  if (!digits) return 0
  const num = parseInt(digits, 10)
  return Number.isFinite(num) ? num : 0
}

export function formatUSD(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '$0.00'
  return usdFormatter.format(num)
}

/**
 * Tiempo relativo en español: "hace 5 minutos", "ayer", etc.
 * Diseñado para timestamps recientes (caché de tasas).
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return ''
  const diff = Date.now() - Number(timestamp)
  if (diff < 0 || !Number.isFinite(diff)) return ''

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'hace un momento'
  if (minutes === 1) return 'hace 1 minuto'
  if (minutes < 60) return `hace ${minutes} minutos`

  const hours = Math.floor(minutes / 60)
  if (hours === 1) return 'hace 1 hora'
  if (hours < 24) return `hace ${hours} horas`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 30) return `hace ${days} días`

  return 'hace mucho tiempo'
}

/**
 * Formato de tasa BCV con 2 decimales.
 *   formatRate(517.9619) → "517,96"
 */
const rateFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
export function formatRate(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0,00'
  return rateFormatter.format(num)
}
