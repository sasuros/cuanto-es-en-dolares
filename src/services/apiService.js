import { getRateValidity } from '../utils/formatters.js'

const DOLAR_API_USD_URL = 'https://ve.dolarapi.com/v1/dolares'
const DOLAR_API_USD_OFICIAL_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
const DOLAR_API_EUR_URL = 'https://ve.dolarapi.com/v1/euros'
const BCVAPI_FALLBACK_URL = 'https://bcvapi.tech/api/v1/dolar'

const CACHE_KEY = 'rates-cache-v3'
const LAST_VALID_KEY = 'rates-last-valid-v3'
const PREVIOUS_RATES_KEY = 'rates-previous-v1'
const OLD_CACHE_KEYS = [
  'bcv-rate-cache-v1',
  'bcv-rate-last-valid-v1',
  'bcv-rate-cache-v2',
  'bcv-rate-last-valid-v2',
  'bcv-rate-previous-v1'
]
const CACHE_TTL_MS = 30 * 60 * 1000
const FETCH_TIMEOUT_MS = 8000

export async function fetchBCVRate({ forceRefresh = false } = {}) {
  const rates = await fetchAllRates({ forceRefresh })
  return {
    ...rates.usd.bcv,
    paralelo: rates.usd.paralelo || null,
    fromCache: rates.fromCache,
    stale: rates.stale
  }
}

export async function fetchRates({ forceRefresh = false } = {}) {
  return fetchAllRates({ forceRefresh })
}

export async function fetchAllRates({ forceRefresh = false } = {}) {
  const cached = readCache()

  if (!forceRefresh && cached && isFresh(cached) && isCurrentCacheShape(cached)) {
    return { ...getRatesFromCache(cached), fromCache: true }
  }

  try {
    const rates = await fetchAllRatesFromEndpoint()
    writeCache(rates)
    return { ...rates, fromCache: false }
  } catch (networkError) {
    if (cached && isCurrentCacheShape(cached)) {
      return { ...getRatesFromCache(cached), fromCache: true, stale: true }
    }
    throw networkError
  }
}

export async function fetchBCVRateForCalculation(opts = {}) {
  const rates = await fetchAllRatesForCalculation(opts)
  return {
    ...rates.usd.bcv,
    paralelo: rates.usd.paralelo || null,
    fromCache: rates.fromCache,
    stale: rates.stale,
    isFallbackFromFuture: rates.isFallbackFromFuture,
    publishedRateFuture: rates.publishedRateFuture
  }
}

export async function fetchAllRatesForCalculation(opts = {}) {
  const latest = await fetchAllRates(opts)
  const validity = getRateValidity(latest.usd?.bcv?.fecha)

  if (validity !== 'future') {
    return latest
  }

  const lastValid = readLastValidRate()
  const publishedFuture = latest.usd?.bcv
    ? { tasa: latest.usd.bcv.tasa, fecha: latest.usd.bcv.fecha }
    : null

  if (lastValid && isCurrentCacheShape(lastValid)) {
    return {
      ...getRatesFromCache(lastValid),
      fromCache: true,
      isFallbackFromFuture: true,
      publishedRateFuture: publishedFuture
    }
  }

  const err = new ApiError('NO_VALID_RATE', 'Aun no tenemos la tasa vigente de hoy')
  err.publishedRateFuture = publishedFuture
  throw err
}

async function fetchAllRatesFromEndpoint() {
  const [usdResult, eurResult] = await Promise.allSettled([
    fetchUsdRatesWithFallback(),
    fetchCurrencyRates(DOLAR_API_EUR_URL, 'Euro BCV', 'Euro paralelo')
  ])

  if (usdResult.status === 'rejected') {
    throw usdResult.reason
  }

  if (eurResult.status === 'rejected') {
    console.warn('[apiService] DolarAPI euros fallo; seguimos solo con dolares:', eurResult.reason)
  }

  return {
    usd: usdResult.value,
    eur: eurResult.status === 'fulfilled' ? eurResult.value : null
  }
}

async function fetchUsdRatesWithFallback() {
  let primaryError

  try {
    return await fetchCurrencyRates(DOLAR_API_USD_URL, 'BCV oficial', 'Paralelo')
  } catch (err) {
    primaryError = err
    console.warn('[apiService] DolarAPI /v1/dolares fallo, probando /oficial:', err)
  }

  try {
    return await fetchDolarApiOfficialRate()
  } catch (officialError) {
    officialError.primaryError = primaryError
    primaryError = officialError
    console.warn('[apiService] DolarAPI /oficial fallo, probando fallback bcvapi.tech:', officialError)
  }

  try {
    return await fetchBcvApiFallbackRate()
  } catch (fallbackError) {
    fallbackError.primaryError = primaryError
    throw fallbackError
  }
}

async function fetchCurrencyRates(url, officialSource, parallelSource) {
  const body = await fetchJson(url)

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
    bcv: normalizeDolarApiRate(oficial, officialSource, fetchedAt),
    paralelo: normalizeDolarApiRate(paralelo, parallelSource, fetchedAt)
  }
}

async function fetchDolarApiOfficialRate() {
  const body = await fetchJson(DOLAR_API_USD_OFICIAL_URL)

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
      throw new ApiError('TIMEOUT', 'La consulta tardo demasiado')
    }
    throw new ApiError('NETWORK', 'Sin conexion a internet')
  } finally {
    clearTimeout(timeoutId)
  }

  let body = null
  try {
    body = await response.json()
  } catch {
    if (response.ok) {
      throw new ApiError('PARSE', 'Respuesta no es JSON valido')
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
    const previous = readCache()
    const previousBcv = previous?.data?.usd?.bcv
    const nextBcv = data?.usd?.bcv

    if (
      previous?.data &&
      previousBcv?.fecha &&
      nextBcv?.fecha &&
      previousBcv.fecha !== nextBcv.fecha
    ) {
      localStorage.setItem(PREVIOUS_RATES_KEY, JSON.stringify({
        data: previous.data,
        savedAt: previous.savedAt || Date.now()
      }))
    }

    const entry = JSON.stringify({ data, savedAt: Date.now() })
    localStorage.setItem(CACHE_KEY, entry)

    const validity = getRateValidity(data?.usd?.bcv?.fecha)
    if (validity !== 'future') {
      localStorage.setItem(LAST_VALID_KEY, entry)
    }
  } catch {
    // localStorage lleno o deshabilitado: seguimos sin cache
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
  return Boolean(cached?.data?.usd?.bcv)
}

function getRatesFromCache(cached) {
  return {
    usd: cached.data.usd,
    eur: cached.data.eur || null
  }
}

export function clearRateCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(LAST_VALID_KEY)
    localStorage.removeItem(PREVIOUS_RATES_KEY)
  } catch {
    // ignorar
  }
}

export function readPreviousRateSnapshot() {
  try {
    const raw = localStorage.getItem(PREVIOUS_RATES_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.data || typeof parsed.savedAt !== 'number') return null
    return { ...getRatesFromCache(parsed), savedAt: parsed.savedAt }
  } catch {
    return null
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

export class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export function getFriendlyErrorMessage(err) {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'NETWORK':
        return 'No hay internet. Revisa tu conexion e intentalo de nuevo.'
      case 'TIMEOUT':
        return 'La conexion esta muy lenta. Intentalo de nuevo.'
      case 'AUTH':
        return 'Hay un problema de configuracion. Avisa al tecnico.'
      case 'QUOTA':
        return 'Llegamos al limite de consultas. Intentalo manana.'
      case 'SERVER':
        return 'El servidor no responde. Intentalo en unos minutos.'
      case 'PARSE':
        return 'Recibimos una respuesta extrana. Intentalo de nuevo.'
      case 'CONFIG':
        return 'La aplicacion no esta bien configurada.'
      case 'NO_VALID_RATE':
        return 'Aun no tenemos la tasa de hoy. El BCV la publica despues de las 4 PM. Intenta mas tarde.'
      default:
        return 'Algo salio mal. Intentalo de nuevo.'
    }
  }
  return 'No pudimos conectar. Intentalo de nuevo.'
}
