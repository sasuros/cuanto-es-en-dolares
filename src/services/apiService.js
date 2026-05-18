/**
 * Servicio para consultar la tasa BCV.
 *
 * Arquitectura:
 *   - El cliente llama a /api/bcv (mismo origen, sin CORS).
 *   - En dev: Vite proxy → bcvapi.tech (key inyectada por vite.config.js).
 *   - En prod: Netlify Function → bcvapi.tech (key inyectada server-side).
 *   - El cliente NUNCA tiene la API key.
 *
 * Caché en cliente:
 *   - localStorage con TTL distinto en dev (10 min) y prod (6 horas).
 *   - El CDN de Netlify también cachea 12h (para todos los usuarios).
 *   - Combinado: cuota mensual de 50 consultas BCV alcanza con sobra.
 *
 * Fallback offline:
 *   - Si la red falla y hay caché aunque sea vieja, la devuelve marcada como stale.
 */

const API_URL = import.meta.env.VITE_BCV_API_URL || '/api/bcv'
const IS_DEV = import.meta.env.DEV
const CACHE_KEY = 'bcv-rate-cache-v1'
const CACHE_TTL_MS = IS_DEV
  ? 10 * 60 * 1000        // 10 min en desarrollo (testing rápido)
  : 6 * 60 * 60 * 1000    // 6 horas en producción
const FETCH_TIMEOUT_MS = 8000

/**
 * Devuelve la tasa BCV. Usa caché si está fresca; si no, consulta el endpoint.
 * Si la red falla y hay caché viejo, lo devuelve marcado como stale.
 *
 * @returns {Promise<{tasa: number, fecha: string, fuente?: string, fetchedAt: number, fromCache: boolean, stale?: boolean}>}
 */
export async function fetchBCVRate({ forceRefresh = false } = {}) {
  const cached = readCache()

  if (!forceRefresh && cached && isFresh(cached)) {
    return { ...cached.data, fromCache: true }
  }

  try {
    const data = await fetchFromEndpoint()
    writeCache(data)
    return { ...data, fromCache: false }
  } catch (networkError) {
    if (cached) {
      return { ...cached.data, fromCache: true, stale: true }
    }
    throw networkError
  }
}

async function fetchFromEndpoint() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let response
  try {
    response = await fetch(API_URL, {
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

  if (typeof body?.tasa !== 'number' || !body?.fecha) {
    throw new ApiError('PARSE', 'Respuesta no tiene los campos esperados')
  }

  return {
    tasa: body.tasa,
    fecha: body.fecha,
    fuente: body.fuente,
    fetchedAt: Date.now()
  }
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
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      savedAt: Date.now()
    }))
  } catch {
    // localStorage lleno o deshabilitado: seguimos sin caché
  }
}

function isFresh(cached) {
  return (Date.now() - cached.savedAt) < CACHE_TTL_MS
}

export function clearRateCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // ignorar
  }
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
      default:
        return 'Algo salió mal. Inténtalo de nuevo.'
    }
  }
  return 'No pudimos conectar. Inténtalo de nuevo.'
}
