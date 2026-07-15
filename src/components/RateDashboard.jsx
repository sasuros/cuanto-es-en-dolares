import {
  formatRate,
  formatRelativeTime,
  getRateValidity
} from '../utils/formatters'
import { readPreviousRateSnapshot } from '../services/apiService.js'

export default function RateDashboard({ rates, loading, error }) {
  if (loading) {
    return (
      <div
        className="result-display result-display--loading"
        role="status"
        aria-live="polite"
      >
        <div className="result-display__spinner-placeholder" aria-hidden="true">
          ⏳
        </div>
        <p className="result-display__loading-text">Consultando tasas...</p>
      </div>
    )
  }

  if (error && typeof error === 'object' && error.type === 'no_valid_rate') {
    return (
      <div
        className="result-display result-display--no-valid"
        role="status"
        aria-live="polite"
      >
        <p className="result-display__no-valid-icon" aria-hidden="true">⏰</p>
        <p className="result-display__no-valid-title">Tasa no disponible aun</p>
        <p className="result-display__no-valid-text">
          El BCV publica la tasa del dia despues de las 4 PM.
        </p>
        {error.futureRate && (
          <div className="result-display__no-valid-future">
            <p className="result-display__no-valid-future-label">
              Para manana sera:
            </p>
            <p className="result-display__no-valid-future-rate">
              {formatRate(error.futureRate.tasa)} <span>Bs/$</span>
            </p>
          </div>
        )}
        <p className="result-display__no-valid-cta">
          Vuelve mas tarde para calcular con la tasa vigente.
        </p>
      </div>
    )
  }

  if (error || !rates?.usd?.bcv) {
    const message = typeof error === 'string'
      ? error
      : (error?.message || 'No pudimos consultar la tasa. Escribe un monto y reintenta.')
    return (
      <div
        className="result-display result-display--error"
        role="alert"
        aria-live="polite"
      >
        <p className="result-display__error-icon" aria-hidden="true">⚠️</p>
        <p className="result-display__error-text">{message}</p>
      </div>
    )
  }

  const previousRates = readPreviousRateSnapshot()
  const usdBcv = rates.usd.bcv
  const usdParalelo = rates.usd.paralelo
  const eurBcv = rates.eur?.bcv
  const eurParalelo = rates.eur?.paralelo
  const validity = getRateValidity(usdBcv.fecha)
  const relativeTime = formatRelativeTime(usdBcv.fetchedAt)
  const publishedDate = formatPublishedDate(usdBcv.fecha)

  const pills = [
    {
      key: 'usd-bcv',
      label: 'Dolar BCV',
      value: usdBcv.tasa,
      unit: 'Bs/$',
      tone: 'usd',
      variation: getVariation(usdBcv.tasa, previousRates?.usd?.bcv?.tasa)
    },
    eurBcv && {
      key: 'eur-bcv',
      label: 'Euro BCV',
      value: eurBcv.tasa,
      unit: 'Bs/€',
      tone: 'eur',
      variation: getVariation(eurBcv.tasa, previousRates?.eur?.bcv?.tasa)
    },
    usdParalelo && {
      key: 'usd-parallel',
      label: '$ Paralelo',
      value: usdParalelo.tasa,
      unit: 'Bs/$',
      tone: 'parallel',
      variation: getVariation(usdParalelo.tasa, previousRates?.usd?.paralelo?.tasa)
    },
    eurParalelo && {
      key: 'eur-parallel',
      label: '€ Paralelo',
      value: eurParalelo.tasa,
      unit: 'Bs/€',
      tone: 'parallel',
      variation: getVariation(eurParalelo.tasa, previousRates?.eur?.paralelo?.tasa)
    }
  ].filter(Boolean)

  return (
    <div
      className="rate-dashboard"
      role="region"
      aria-label="Dashboard de tasas"
    >
      <div className={`rate-dashboard__grid rate-dashboard__grid--${pills.length}`}>
        {pills.map(pill => (
          <RatePill key={pill.key} {...pill} />
        ))}
      </div>

      <div className="rate-dashboard__meta">
        {validity === 'today' && (
          <p className="result-display__validity result-display__validity--today">
            ✅ Vigente: HOY
          </p>
        )}
        {validity === 'future' && (
          <p className="result-display__validity result-display__validity--future">
            ⚠️ Vigente desde: manana
          </p>
        )}
        {publishedDate && (
          <p className="result-display__date">
            Publicada: {publishedDate}
          </p>
        )}
        {relativeTime && (
          <p className="result-display__updated">
            Consultada {relativeTime}
          </p>
        )}
      </div>
    </div>
  )
}

function RatePill({ label, value, unit, tone, variation }) {
  return (
    <div className={`rate-pill rate-pill--${tone}`}>
      <p className="rate-pill__label">{label}</p>
      <p className="rate-pill__value">{formatRate(value)}</p>
      <p className="rate-pill__unit">{unit}</p>
      {variation && (
        <p
          className={
            'rate-pill__variation ' +
            (variation.isLower ? 'rate-pill__variation--lower' : 'rate-pill__variation--higher')
          }
        >
          {variation.isLower ? '▼' : '▲'} {Math.abs(variation.percent).toFixed(2)}%
        </p>
      )}
    </div>
  )
}

function getVariation(currentValue, previousValue) {
  const current = Number(currentValue)
  const previous = Number(previousValue)

  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return null
  }

  const percent = ((current - previous) / previous) * 100
  if (Math.abs(percent) < 0.005) return null

  return {
    percent,
    isLower: percent < 0
  }
}

function formatPublishedDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-VE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}
