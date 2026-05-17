/**
 * Servicio para consultar la tasa BCV.
 * - Caché en localStorage (TTL 10 minutos)
 * - Fallback a caché vieja si la red falla
 * - Timeout de 8s para no dejar al usuario esperando indefinidamente
 *
 * Endpoint: https://bcvapi.tech/api/v1/dolar
 * Respuesta esperada: { tasa: number, fecha: string, fuente: string, registrado: boolean }
 */

const API_URL = import.meta.env.VITE_BCV_API_URL || 'https://bcvapi.tech/api/v1/dolar'
const API_KEY = import.meta.env.VITE_BCV_API_KEY
const CACHE_KEY = 'bcv-rate-cache-v1'
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutos
const FETCH_TIMEOUT_MS = 8000        // 8 segundos

/**
 * Devuelve la tasa BCV. Usa caché si está fresca; si no, consulta API.
 * Si la API falla y hay caché aunque sea vieja, la devuelve marcada como stale.
 *
 * @returns {Promise<{tasa: number, fecha: string, fuente?: string, fetchedAt: number, fromCache: boolean, stale?: boolean}>}
 */
export async function fetchBCVRate({ forceRefresh = false } = {}) {
  const cached = readCache()

  if (!forceRefresh && cached && isFresh(cached)) {
    return { ...cached.data, fromCache: true }
  }

  try {
    const data = await fetchFromAPI()
    writeCache(data)
    return { ...data, fromCache: false }
  } catch (networkError) {
    if (cached) {
      return { ...cached.data, fromCache: true, stale: true }
    }
    throw networkError
  }
}

async function fetchFromAPI() {
  if (!API_KEY) {
    throw new ApiError('CONFIG', 'API key no configurada. Revisa el archivo .env.local')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let response
  try {
    response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': API_KEY,
        'Accept': 'application/json'
      },
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

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ApiError('AUTH', 'API key inválida o sin permisos')
    }
    if (response.status === 429) {
      throw new ApiError('QUOTA', 'Se alcanzó el límite de consultas del mes')
    }
    throw new ApiError('SERVER', `El servidor respondió con error ${response.status}`)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new ApiError('PARSE', 'Respuesta del servidor no es JSON válido')
  }

  if (typeof data.tasa !== 'number' || !data.fecha) {
    throw new ApiError('PARSE', 'Respuesta del servidor no tiene los campos esperados')
  }

  return {
    tasa: data.tasa,
    fecha: data.fecha,
    fuente: data.fuente,
    fetchedAt: Date.now()
  }
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
    // localStorage lleno o deshabilitado: continuamos sin caché
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
