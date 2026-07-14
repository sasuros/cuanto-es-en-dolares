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

// v0.4.1: separamos dos formatters de Bs.
// - INTEGER: para input del usuario (sin decimales, sólo dígitos)
// - AMOUNT: para resultados de cálculo (hasta 2 decimales si aplica)
// Su mamá notó que $1 × 523,68 daba "524" (redondeado). Ahora muestra "523,68".
const bolivaresIntegerFormatter = new Intl.NumberFormat('es-VE', {
  maximumFractionDigits: 0,
  useGrouping: true
})

const bolivaresAmountFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  useGrouping: true
})

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function formatBolivares(value) {
  // v0.4.1: si es número (resultado de cálculo), muestra hasta 2 decimales
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return ''
    return bolivaresAmountFormatter.format(value)
  }

  // v0.4.2: si es string (input del usuario), permite decimales con coma.
  //   "12058,55" → "12.058,55"
  //   "12058"    → "12.058"
  //   ",5"       → "0,5"
  //   "12058,"   → "12.058," (durante tipeo)
  const str = String(value ?? '')
  if (!str) return ''

  const commaIdx = str.indexOf(',')
  if (commaIdx === -1) {
    // Entero puro
    const digits = str.replace(/[^\d]/g, '')
    if (!digits) return ''
    const num = parseInt(digits, 10)
    return Number.isFinite(num) ? bolivaresIntegerFormatter.format(num) : ''
  }

  // Con decimal
  const intStr = str.slice(0, commaIdx).replace(/[^\d]/g, '')
  const decStr = str.slice(commaIdx + 1).replace(/[^\d]/g, '').slice(0, 2)

  let intFormatted
  if (!intStr) {
    intFormatted = '0' // usuario empezó tipeando ","
  } else {
    const num = parseInt(intStr, 10)
    intFormatted = Number.isFinite(num) ? bolivaresIntegerFormatter.format(num) : '0'
  }

  return intFormatted + ',' + decStr
}

export function parseBolivares(str) {
  if (!str) return 0
  // v0.4.2: parsea "12.058,55" → 12058.55 (float)
  const cleaned = String(str).replace(/[^\d.,]/g, '')
  if (!cleaned) return 0

  // El separador decimal es el ÚLTIMO , o . que aparece.
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  const lastSep = Math.max(lastComma, lastDot)

  let normalized
  if (lastSep === -1) {
    normalized = cleaned.replace(/[^\d]/g, '')
  } else {
    const intPart = cleaned.slice(0, lastSep).replace(/[^\d]/g, '')
    const decPart = cleaned.slice(lastSep + 1).replace(/[^\d]/g, '')
    normalized = (intPart || '0') + '.' + (decPart || '0')
  }

  const num = parseFloat(normalized)
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

/**
 * Vigencia de la tasa BCV.
 *
 * El BCV publica la tasa del día siguiente entre las 3-4 PM VET.
 * Los comercios en Venezuela cobran con la tasa VIGENTE HOY, no con la
 * que ya publicó el BCV "para mañana". Así que necesitamos avisarle al
 * usuario si la tasa que ve es para hoy o para mañana, para que decida.
 *
 * Devuelve: 'today' | 'future' | 'past' | 'unknown'
 */
const SPANISH_MONTHS = {
  enero: 0, febrero: 1, marzo: 2, abril: 3,
  mayo: 4, junio: 5, julio: 6, agosto: 7,
  septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
}

function parseSpanishDate(str) {
  if (!str || typeof str !== 'string') return null
  // "Martes, 19 Mayo 2026" → tomamos lo que viene después de la coma
  const afterComma = str.includes(',') ? str.split(',')[1].trim() : str.trim()
  const parts = afterComma.split(/\s+/)
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const monthIdx = SPANISH_MONTHS[parts[1].toLowerCase()]
  const year = parseInt(parts[2], 10)
  if (!Number.isFinite(day) || monthIdx === undefined || !Number.isFinite(year)) {
    return null
  }
  return { year, month: monthIdx, day }
}

function parseIsoDate(str) {
  if (!str || typeof str !== 'string') return null
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/)
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const day = parseInt(match[3], 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }
  return { year, month, day }
}

function todayInVenezuela() {
  // Forzamos zona horaria America/Caracas — no usamos el reloj del usuario
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())
  const obj = { year: 0, month: 0, day: 0 }
  for (const p of parts) {
    if (p.type === 'year') obj.year = parseInt(p.value, 10)
    if (p.type === 'month') obj.month = parseInt(p.value, 10) - 1
    if (p.type === 'day') obj.day = parseInt(p.value, 10)
  }
  return obj
}

function compareYMD(a, b) {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1
  if (a.month !== b.month) return a.month < b.month ? -1 : 1
  if (a.day !== b.day) return a.day < b.day ? -1 : 1
  return 0
}

export function getRateValidity(fechaString) {
  const parsed = parseIsoDate(fechaString) || parseSpanishDate(fechaString)
  if (!parsed) return 'unknown'
  const today = todayInVenezuela()
  const cmp = compareYMD(parsed, today)
  if (cmp > 0) return 'future'
  if (cmp < 0) return 'past'
  return 'today'
}
