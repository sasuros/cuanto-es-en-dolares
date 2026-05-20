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
  // Si es número (ej. resultado de USD * tasa), redondear al entero más cercano.
  // Los bolívares se manejan en enteros (no hay céntimos en uso práctico).
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return ''
    return bolivaresFormatter.format(Math.round(value))
  }
  // Si es string (ej. lo que el usuario tipea), strip de no-dígitos.
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

/**
 * Formato de ENTRADA de USD: estilo americano, separador de miles "," + hasta 2 decimales.
 * Sin símbolo $ (lo agrega el sufijo del input).
 *   formatUSDInput("1500.5")    → "1,500.5"
 *   formatUSDInput("1500")      → "1,500"
 *   formatUSDInput("100.999")   → "100.99"   (trunca a 2 decimales)
 *   formatUSDInput("12.34.56")  → "12.3456"  → "12.34"
 */
export function formatUSDInput(value) {
  const str = String(value ?? '')
  if (!str) return ''

  const cleaned = str.replace(/[^\d.]/g, '')
  if (!cleaned) return ''

  const firstDot = cleaned.indexOf('.')
  let intPart
  let decPart

  if (firstDot === -1) {
    intPart = cleaned
    decPart = ''
  } else {
    intPart = cleaned.slice(0, firstDot)
    // Permitir solo un punto y máximo 2 decimales
    decPart = '.' + cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, 2)
  }

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return formattedInt + decPart
}

/**
 * Parsea un input USD a número.
 *   parseUSDInput("1,500.50") → 1500.5
 */
export function parseUSDInput(str) {
  const cleaned = String(str ?? '').replace(/[^\d.]/g, '')
  if (!cleaned) return 0
  const num = parseFloat(cleaned)
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
