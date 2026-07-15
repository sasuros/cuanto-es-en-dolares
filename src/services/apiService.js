/**
 * Servicio para consultar la tasa BCV.
 *
 * Arquitectura:
 *   - El cliente llama directo a ve.dolarapi.com (sin API key).
 *   - Pide BCV + paralelo en una sola llamada.
 *   - Si falla, degrada a BCV oficial sin paralelo.
 *
 * Caché en cliente:
 *   - localStorage con TTL de 30 minutos.
 *
 * Fallback offline:
 *   - Si la red falla y hay caché aunque sea vieja, la devuelve marcada como stale.
 */

import { getRateValidity } from '../utils/formatters'

const DOLAR_API_URL = 'https://ve.dolarapi.com/v1/dolares'
const DOLAR_API_OFICIAL_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
const BCVAPI_FALLBACK_URL = 'https://bcvapi.tech/api/v1/dolar'
const CACHE_KEY = 'bcv-rate-cache-v2'
const LAST_VALID_KEY = 'bcv-rate-last-valid-v2'  // caché de la última tasa con validity != 'future'
const OLD_CACHE_KEYS = [
  'bcv-rate-cache-v1',
  'bcv-rate-last-valid-v1'
]
const CACHE_TTL_MS = 30 * 60 * 1000
const FETCH_TIMEOUT_MS = 8000

/**
 * Devuelve la tasa BCV. Usa caché si está fresca; si no, consulta el endpoint.
 * Si la red falla y hay caché viejo, lo devuelve marcado como stale.
 *
 * @returns {Promise<{tasa: number, fecha: string, fuente?: string, paralelo?: object, fetchedAt: number, fromCache: boolean, stale?: boolean}>}
 */
export async function fetchBCVRate({ forceRefresh = false } = {}) {
  const cached = readCache()

  if (!forceRefresh && cached && isFresh(cached) && isCurrentCacheShape(cached)) {
    return { ...getBcvRateFromCache(cached), fromCache: true }
  }

  try {
    const rates = await fetchRatesFromEndpoint()
    writeCache(rates)
    return { ...rates.bcv, paralelo: rates.paralelo, fromCache: false }
  } catch (networkError) {
    if (cached) {
      return { ...getBcvRateFromCache(cached), fromCache: true, stale: true }
    }
    throw networkError
  }
}

export async function fetchRates({ forceRefresh = false } = {}) {
  const cached = readCache()

  if (!forceRefresh && cached && isFresh(cached) && isCurrentCacheShape(cached)) {
    return { ...getRatesFromCache(cached), fromCache: true }
  }

  try {
    const rates = await fetchRatesFromEndpoint()
    writeCache(rates)
    return { ...rates, fromCache: false }
  } catch (networkError) {
    if (cached) {
      return { ...getRatesFromCache(cached), fromCache: true, stale: true }
    }
    throw networkError
  }
}

async function fetchRatesFromEndpoint() {
  let primaryError

  try {
    return await fetchDolarApiRates()
  } catch (err) {
    primaryError = err
    console.warn('[apiService] DolarAPI /v1/dolares falló, probando /oficial:', err)
  }

  try {
    return await fetchDolarApiOfficialRate()
  } catch (officialError) {
    officialError.primaryError = primaryError
    primaryError = officialError
    console.warn('[apiService] DolarAPI /oficial falló, probando fallback bcvapi.tech:', officialError)
  }

  try {
    return await fetchBcvApiFallbackRate()
  } catch (fallbackError) {
    fallbackError.primaryError = primaryError
    throw fallbackError
  }
}

async function fetchDolarApiRates() {
  const body = await fetchJson(DOLAR_API_URL)

  if (!Array.isArray(body)) {
    throw new ApiError('PARSE', 'Respuesta de DolarAPI no tiene los campos esperados')
  }

  const oficial = body.find(rate => rate?.fuente === 'oficial')
  const paralelo = body.find(rate => rate?.fuente === 'paralelo')

  if (typeof oficial?.promedio !== 'number' || !oficial?.fechaActualizacion) {
    throw new ApiError('PARSE', 'Respuesta de DolarAPI no incluye tasa oficial')
  }

  const fetchedAt = Date.now()
  return {
    bcv: normalizeDolarApiRate(oficial, 'BCV oficial', fetchedAt),
    paralelo: normalizeDolarApiRate(paralelo, 'Paralelo', fetchedAt)
  }
}

async function fetchDolarApiOfficialRate() {
  const body = await fetchJson(DOLAR_API_OFICIAL_URL)

  if (typeof body?.promedio !== 'number' || !body?.fechaActualizacion) {
    throw new ApiError('PARSE', 'Respuesta de DolarAPI oficial no tiene los campos esperados')
  }

  const fetchedAt = Date.now()
  return {
    bcv: normalizeDolarApiRate(body, 'BCV oficial', fetchedAt),
    paralelo: null
  }
}

async function fetchBcvApiFallbackRate() {
  const body = await fetchJson(BCVAPI_FALLBACK_URL)

  if (typeof body?.tasa !== 'number' || !body?.fecha) {
    throw new ApiError('PARSE', 'Respuesta de bcvapi.tech no tiene los campos esperados')
  }

  return {
    bcv: {
      tasa: body.tasa,
      fecha: body.fecha,
      fuente: body.fuente || 'bcvapi.tech',
      fetchedAt: Date.now()
    },
    paralelo: null
  }
}

function normalizeDolarApiRate(rate, fallbackFuente, fetchedAt) {
  if (!rate || typeof rate.promedio !== 'number' || !rate.fechaActualizacion) return null
  return {
    tasa: rate.promedio,
    fecha: rate.fechaActualizacion,
    fuente: fallbackFuente,
    fetchedAt
  }
}

async function fetchJson(url) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'La consulta tardó demasiado')
    }
    throw new ApiError('NETWORK', 'Sin conexión a internet')
  } finally {
    clearTimeout(timeoutId)
  }

  let body = null
  try {
    body = await response.json()
  } catch {
    if (response.ok) {
      throw new ApiError('PARSE', 'Respuesta no es JSON válido')
    }
  }

  if (!response.ok) {
    const code = body?.error || mapStatusToCode(response.status)
    const message = body?.message || `Respuesta ${response.status}`
    throw new ApiError(code, message)
  }

  return body
}

function mapStatusToCode(status) {
  if (status === 401 || status === 403) return 'AUTH'
  if (status === 429) return 'QUOTA'
  if (status >= 500) return 'SERVER'
  return 'SERVER'
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.data || typeof parsed.savedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    const entry = JSON.stringify({ data, savedAt: Date.now() })
    localStorage.setItem(CACHE_KEY, entry)

    // v0.4.0: si la tasa es de HOY (o pasada — fin de semana, etc.), también
    // la guardamos como "última válida". Las tasas FUTURAS NO se copian aquí,
    // así que este slot siempre contiene la última tasa segura para cálculos.
    const bcv = getBcvRateFromData(data)
    const validity = getRateValidity(bcv?.fecha)
    if (validity !== 'future') {
      localStorage.setItem(LAST_VALID_KEY, entry)
    }
  } catch {
    // localStorage lleno o deshabilitado: seguimos sin caché
  }
}

function readLastValidRate() {
  try {
    const raw = localStorage.getItem(LAST_VALID_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.data || typeof parsed.savedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function isFresh(cached) {
  return (Date.now() - cached.savedAt) < CACHE_TTL_MS
}

function isCurrentCacheShape(cached) {
  return Boolean(cached?.data?.bcv && cached.data.paralelo)
}

function getBcvRateFromData(data) {
  return data?.bcv || data
}

function getRatesFromCache(cached) {
  const bcv = getBcvRateFromData(cached.data)
  const paralelo = cached.data?.paralelo || bcv?.paralelo || null
  return { bcv, paralelo }
}

function getBcvRateFromCache(cached) {
  const { bcv, paralelo } = getRatesFromCache(cached)
  return { ...bcv, paralelo }
}

export function clearRateCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(LAST_VALID_KEY)
  } catch {
    // ignorar
  }
}

export function clearObsoleteRateCaches() {
  try {
    for (const key of OLD_CACHE_KEYS) {
      localStorage.removeItem(key)
    }
  } catch {
    // ignorar
  }
}

/**
 * v0.4.0: variante de fetchBCVRate que GARANTIZA devolver una tasa con
 * validity ∈ {today, past, unknown} — nunca "future".
 *
 * Política: la app NO debe calcular conversiones con la tasa "de mañana"
 * que el BCV publica desde ~4 PM VET — los comercios siguen cobrando con
 * la tasa vigente HOY hasta medianoche.
 *
 * Lógica:
 *   1. Pide la tasa más reciente (cache o API).
 *   2. Si NO es futura → devuelve directamente.
 *   3. Si ES futura → busca en LAST_VALID_KEY la última tasa no-futura.
 *      - Si existe → devuelve esa, marca `isFallbackFromFuture: true` y
 *        adjunta `publishedRateFuture` (info de la tasa de mañana).
 *      - Si no existe → throw ApiError('NO_VALID_RATE') con `publishedRateFuture`
 *        adjunto para que la UI pueda mostrarla como referencia.
 *
 * Esta es la función que debe usar TODA la app para calcular o mostrar
 * "la tasa actual". El fetchBCVRate "crudo" queda como helper interno.
 */
export async function fetchBCVRateForCalculation(opts = {}) {
  const latest = await fetchBCVRate(opts)
  const validity = getRateValidity(latest.fecha)

  if (validity !== 'future') {
    return latest
  }

  // Si la tasa más reciente es futura, preferimos la última vigente
  // del caché (cuando existe). Esa tasa es 100% correcta para calcular HOY.
  const lastValid = readLastValidRate()
  const publishedFuture = { tasa: latest.tasa, fecha: latest.fecha }

  if (lastValid) {
    const validRate = getBcvRateFromCache(lastValid)
    return {
      ...validRate,
      fromCache: true,
      isFallbackFromFuture: true,
      publishedRateFuture: publishedFuture
    }
  }

  // v0.4.1 corregido: NO calculamos con tasa de mañana. Antes (v0.4.1 inicial)
  // devolvíamos la tasa futura con flag, pero eso permite cálculos incorrectos
  // si el usuario no lee el warning. La regla de oro es:
  //   "Nunca, jamás, calcular con tasa que sea del FUTURO."
  // Lanzamos un error tipado para que la UI muestre la tasa de mañana SOLO
  // como referencia y bloquee los cálculos.
  const err = new ApiError(
    'NO_VALID_RATE',
    'Aún no tenemos la tasa vigente de hoy'
  )
  err.publishedRateFuture = publishedFuture
  throw err
}

/**
 * Error tipado para distinguir causas y traducir a mensajes amigables.
 */
export class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/**
 * Traduce un error a mensaje amigable para adultos mayores.
 * Sin tecnicismos, con acción clara.
 */
export function getFriendlyErrorMessage(err) {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'NETWORK':
        return 'No hay internet. Revisa tu conexión e inténtalo de nuevo.'
      case 'TIMEOUT':
        return 'La conexión está muy lenta. Inténtalo de nuevo.'
      case 'AUTH':
        return 'Hay un problema de configuración. Avisa al técnico.'
      case 'QUOTA':
        return 'Llegamos al límite de consultas. Inténtalo mañana.'
      case 'SERVER':
        return 'El servidor no responde. Inténtalo en unos minutos.'
      case 'PARSE':
        return 'Recibimos una respuesta extraña. Inténtalo de nuevo.'
      case 'CONFIG':
        return 'La aplicación no está bien configurada.'
      case 'NO_VALID_RATE':
        return 'Aún no tenemos la tasa de hoy. El BCV la publica después de las 4 PM. Intenta más tarde.'
      default:
        return 'Algo salió mal. Inténtalo de nuevo.'
    }
  }
  return 'No pudimos conectar. Inténtalo de nuevo.'
}
