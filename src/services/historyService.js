const HISTORY_BASE_URL = 'https://ve.dolarapi.com/v1/historicos'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const HISTORY_DAYS = 90
const FETCH_TIMEOUT_MS = 8000

// Verificado en vivo (2026-09-06): la serie mas vieja de la API arranca aqui.
export const HISTORY_EARLIEST_DATE = '2023-01-03'

function seriesPath(currency) {
  return currency === 'eur' ? 'euros' : 'dolares'
}

function cacheKey(currency) {
  return `historical-cache-${currency}`
}

async function fetchJson(url) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    })

    if (response.status === 404) {
      return { ok: false, status: 404, body: null }
    }

    if (!response.ok) {
      return { ok: false, status: response.status, body: null }
    }

    const body = await response.json()
    return { ok: true, status: response.status, body }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('TIMEOUT')
    }
    throw new Error('NETWORK')
  } finally {
    clearTimeout(timeoutId)
  }
}

// La API devuelve un array plano con fuente:'oficial'|'paralelo' mezclados
// y no garantiza orden global por fecha (verificado en vivo). Agrupamos por
// fecha y ordenamos explicito.
function normalizeSeries(rawArray) {
  const byDate = new Map()

  for (const entry of rawArray) {
    if (!entry?.fecha || typeof entry.promedio !== 'number') continue

    const existing = byDate.get(entry.fecha) || { fecha: entry.fecha, bcv: null, paralelo: null }
    if (entry.fuente === 'oficial') existing.bcv = entry.promedio
    if (entry.fuente === 'paralelo') existing.paralelo = entry.promedio
    byDate.set(entry.fecha, existing)
  }

  return [...byDate.values()].sort((a, b) => {
    if (a.fecha < b.fecha) return -1
    if (a.fecha > b.fecha) return 1
    return 0
  })
}

function readCache(currency) {
  try {
    const raw = localStorage.getItem(cacheKey(currency))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.data) || typeof parsed?.savedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(currency, data) {
  try {
    localStorage.setItem(cacheKey(currency), JSON.stringify({ data, savedAt: Date.now() }))
  } catch {
    // localStorage lleno o deshabilitado: seguimos sin cache
  }
}

function isFresh(cached) {
  return (Date.now() - cached.savedAt) < CACHE_TTL_MS
}

export async function fetchHistoricalSeries(currency) {
  const cached = readCache(currency)
  if (cached && isFresh(cached)) {
    return cached.data
  }

  try {
    const result = await fetchJson(`${HISTORY_BASE_URL}/${seriesPath(currency)}`)

    if (!result.ok || !Array.isArray(result.body)) {
      throw new Error('PARSE')
    }

    const normalized = normalizeSeries(result.body).slice(-HISTORY_DAYS)
    writeCache(currency, normalized)
    return normalized
  } catch (err) {
    if (cached) return cached.data
    throw err
  }
}

// Un dia especifico. 404 (finde/feriado/futuro) => null, no es un error.
export async function fetchRateByDate(currency, fuente, fechaISO) {
  const [year, month, day] = String(fechaISO || '').split('-')
  if (!year || !month || !day) return null

  const result = await fetchJson(`${HISTORY_BASE_URL}/${seriesPath(currency)}/${fuente}/${year}/${month}/${day}`)

  if (!result.ok || typeof result.body?.promedio !== 'number') {
    return null
  }

  return result.body.promedio
}
