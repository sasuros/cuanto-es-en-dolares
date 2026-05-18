/**
 * Proxy server-side a bcvapi.tech.
 *
 * Por qué existe:
 *   - El navegador no puede llamar a bcvapi.tech directamente (CORS).
 *   - La API key NO debe ir en el bundle del cliente.
 *
 * Caching:
 *   - Netlify-CDN-Cache-Control: cache de CDN compartido (12h).
 *     Todos los usuarios reciben la misma respuesta cacheada → ~44 consultas reales/mes.
 *   - Cache-Control para el cliente: el navegador siempre revalida vía CDN.
 *
 * Endpoint público: /api/bcv (configurado abajo en `config.path`)
 */

const BCV_URL = 'https://bcvapi.tech/api/v1/dolar'
const CDN_CACHE_SECONDS = 12 * 60 * 60 // 12 horas

export default async function handler() {
  const apiKey = process.env.BCV_API_KEY

  if (!apiKey) {
    return jsonResponse(
      { error: 'CONFIG', message: 'BCV_API_KEY no está configurada en el servidor' },
      500
    )
  }

  let upstream
  try {
    upstream = await fetch(BCV_URL, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Accept': 'application/json'
      }
    })
  } catch (err) {
    console.error('[bcv-rate] fetch falló:', err)
    return jsonResponse(
      { error: 'NETWORK', message: 'No pudimos contactar el servicio de tasas' },
      502
    )
  }

  if (!upstream.ok) {
    let code = 'SERVER'
    if (upstream.status === 401 || upstream.status === 403) code = 'AUTH'
    else if (upstream.status === 429) code = 'QUOTA'
    return jsonResponse(
      { error: code, message: `BCV API respondió ${upstream.status}` },
      upstream.status
    )
  }

  let data
  try {
    data = await upstream.json()
  } catch {
    return jsonResponse(
      { error: 'PARSE', message: 'Respuesta del BCV no es JSON válido' },
      502
    )
  }

  if (typeof data.tasa !== 'number' || !data.fecha) {
    return jsonResponse(
      { error: 'PARSE', message: 'Respuesta del BCV no tiene los campos esperados' },
      502
    )
  }

  const body = {
    tasa: data.tasa,
    fecha: data.fecha,
    fuente: data.fuente,
    registrado: data.registrado
  }

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // CDN cachea por 12h, sobrevive deploys ('durable')
      'Netlify-CDN-Cache-Control': `public, s-maxage=${CDN_CACHE_SECONDS}, durable`,
      // Cliente siempre revalida con el CDN (que sí cachea)
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  })
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  })
}

// La función responde directamente en /api/bcv (sin necesidad de redirect en netlify.toml)
export const config = {
  path: '/api/bcv'
}
