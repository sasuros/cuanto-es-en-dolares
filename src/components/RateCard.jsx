import {
  formatRate,
  formatRelativeTime,
  getRateValidity
} from '../utils/formatters'
import { readPreviousRateSnapshot } from '../services/apiService.js'

export default function RateCard({ rates, usdt = null, loading, error }) {
  if (loading) {
    return (
      <section className="rate-card rate-card--status" aria-live="polite">
        <p className="rate-card__title">Tasas de hoy</p>
        <p className="rate-card__status-text">Consultando tasas...</p>
      </section>
    )
  }

  if (error || !rates?.usd?.bcv) {
    const message = typeof error === 'string'
      ? error
      : (error?.message || 'No pudimos consultar la tasa. Escribe un monto y reintenta.')

    return (
      <section className="rate-card rate-card--status" role="alert">
        <p className="rate-card__title">Tasas de hoy</p>
        <p className="rate-card__status-text">{message}</p>
      </section>
    )
  }

  const previousRates = readPreviousRateSnapshot()
  const usdBcv = rates.usd.bcv
  const eurBcv = rates.eur?.bcv
  const usdtRate = usdt || rates.usdt || null
  const validity = getRateValidity(usdBcv.fecha)
  const publishedDate = formatPublishedDate(usdBcv.fecha)
  const relativeTime = formatRelativeTime(usdBcv.fetchedAt)
  const badgeText = validity === 'today'
    ? `✅ HOY${publishedDate ? ` · ${publishedDate}` : ''}`
    : publishedDate || 'Tasa vigente'

  const pills = [
    {
      key: 'usd-bcv',
      label: '$ BCV',
      value: usdBcv.tasa,
      tone: 'primary',
      variation: getVariation(usdBcv.tasa, previousRates?.usd?.bcv?.tasa)
    },
    eurBcv && {
      key: 'eur-bcv',
      label: '€ BCV',
      value: eurBcv.tasa,
      tone: 'blue',
      variation: getVariation(eurBcv.tasa, previousRates?.eur?.bcv?.tasa)
    },
    usdtRate && Number.isFinite(usdtRate.tasa) && {
      key: 'usdt',
      label: '$ USDT',
      value: usdtRate.tasa,
      tone: 'orange',
      variation: getVariation(usdtRate.tasa, previousRates?.usdt?.tasa)
    }
  ].filter(Boolean)

  return (
    <section className="rate-card" aria-label="Tasas de hoy">
      <div className="rate-card__header">
        <p className="rate-card__title">Tasas de hoy</p>
        <p className="rate-card__badge">{badgeText}</p>
      </div>

      <div className={`rate-card__grid rate-card__grid--${pills.length}`}>
        {pills.map(pill => (
          <RatePill key={pill.key} {...pill} />
        ))}
      </div>

      {relativeTime && (
        <p className="rate-card__updated">Consultada {relativeTime}</p>
      )}
    </section>
  )
}

function RatePill({ label, value, tone, variation }) {
  return (
    <div className={`rate-card__pill rate-card__pill--${tone}`}>
      <span className="rate-card__pill-label">{label}</span>
      <span className="rate-card__pill-value">{formatRate(value)}</span>
      {variation && (
        <span
          className={
            'rate-card__pill-variation ' +
            (variation.isLower ? 'rate-card__pill-variation--lower' : 'rate-card__pill-variation--higher')
          }
        >
          {variation.isLower ? '▼' : '▲'} {Math.abs(variation.percent).toFixed(2)}%
        </span>
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
