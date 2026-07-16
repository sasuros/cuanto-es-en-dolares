export default async () => {
  try {
    const apiKey = process.env.COTIZAVE_API_KEY
    if (!apiKey) {
      return jsonResponse({ error: 'No key' }, 500)
    }

    const res = await fetch('https://api.cotizave.com/v1/fx/rates', {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    })

    if (!res.ok) throw new Error(`Cotizave: ${res.status}`)

    const data = await res.json()
    const rates = Array.isArray(data?.rates) ? data.rates : []
    const binance = findBinanceRate(rates)

    return jsonResponse({
      usdt: binance?.mid || null,
      ask: binance?.ask || null,
      bid: binance?.bid || null,
      updated_at: binance?.updated_at || data?.fetched_at || null
    }, 200, {
      'Cache-Control': 'public, max-age=300'
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}

function findBinanceRate(rates) {
  return rates.find(rate =>
    rate?.market === 'binance' ||
    rate?.market === 'binance_p2p' ||
    (rate?.type === 'p2p' && /binance/i.test(rate?.market || ''))
  )
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders
    }
  })
}
