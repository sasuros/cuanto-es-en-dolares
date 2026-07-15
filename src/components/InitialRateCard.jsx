import {
  formatRate,
  getRateValidity
} from '../utils/formatters'
import { readPreviousRateSnapshot } from '../services/apiService.js'

/**
 * Tarjeta que muestra la tasa BCV vigente al abrir la app.
 * v0.4.1: si la tasa es futura, se muestra con badge "Tasa de referencia"
 * pero NO bloquea la app (calculadora sigue funcional 24/7).
 */
export default function InitialRateCard({ rate, paralelo, loading, error }) {
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
        <p className="result-display__loading-text">Consultando tasa del BCV…</p>
      </div>
    )
  }

  // v0.4.1 corregido: si la tasa más reciente es futura y no hay caché válido,
  // NO calculamos. Mostramos la tasa de mañana SOLO como referencia.
  if (error && typeof error === 'object' && error.type === 'no_valid_rate') {
    return (
      <div
        className="result-display result-display--no-valid"
        role="status"
        aria-live="polite"
      >
        <p className="result-display__no-valid-icon" aria-hidden="true">⏰</p>
        <p className="result-display__no-valid-title">Tasa no disponible aún</p>
        <p className="result-display__no-valid-text">
          El BCV publica la tasa del día después de las 4 PM.
        </p>
        {error.futureRate && (
          <div className="result-display__no-valid-future">
            <p className="result-display__no-valid-future-label">
              ℹ️ Para mañana será:
            </p>
            <p className="result-display__no-valid-future-rate">
              {formatRate(error.futureRate.tasa)} <span>Bs/$</span>
            </p>
          </div>
        )}
        <p className="result-display__no-valid-cta">
          Vuelve más tarde para calcular con la tasa vigente.
        </p>
      </div>
    )
  }

  if (error || !rate) {
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

  const validity = getRateValidity(rate.fecha)
  const isFuture = rate.isFuture === true
  const showParalelo =
    paralelo &&
    Number.isFinite(paralelo.tasa) &&
    Number.isFinite(rate.tasa) &&
    rate.tasa > 0
  const previousRates = readPreviousRateSnapshot()
  const bcvVariation = getDailyVariation(rate.tasa, previousRates?.bcv?.tasa)
  const paraleloVariation = showParalelo
    ? getDailyVariation(paralelo.tasa, previousRates?.paralelo?.tasa)
    : null
  const publishedDate = formatPublishedDate(rate.fecha)

  return (
    <div
      className="result-display result-display--info"
      role="region"
      aria-label="Tasa actual del BCV"
    >
      {isFuture && (
        <div className="result-display__future-badge" role="status">
          <span aria-hidden="true">⚠️</span>
          <span>Tasa de referencia · vigente mañana</span>
        </div>
      )}

      <p className="result-display__label initial-rate-card__title">Dólar BCV</p>

      <div className={`initial-rate-card__pills${showParalelo ? '' : ' initial-rate-card__pills--single'}`}>
        <RatePill
          label="BCV"
          value={rate.tasa}
          variation={bcvVariation}
          tone="primary"
        />
        {showParalelo && (
          <RatePill
            label="Paralelo"
            value={paralelo.tasa}
            variation={paraleloVariation}
            tone="secondary"
          />
        )}
      </div>

      <div className="result-display__meta">
        {validity === 'today' && (
          <p className="result-display__validity result-display__validity--today">
            ✅ Vigente: HOY
          </p>
        )}
        {validity === 'future' && (
          <p className="result-display__validity result-display__validity--future">
            ⚠️ Vigente desde: mañana
          </p>
        )}

        {rate.fecha && (
          <p className="result-display__date">
            Publicada: {publishedDate}
          </p>
        )}
      </div>
    </div>
  )
}

function RatePill({ label, value, variation, tone }) {
  return (
    <div className={`initial-rate-pill initial-rate-pill--${tone}`}>
      <p className="initial-rate-pill__value">{formatRate(value)}</p>
      <p className="initial-rate-pill__label">{label}</p>
      {variation && (
        <p
          className={
            'initial-rate-pill__variation ' +
            (variation.isLower ? 'initial-rate-pill__variation--lower' : 'initial-rate-pill__variation--higher')
          }
        >
          {variation.isLower ? '▼' : '▲'}{Math.abs(variation.percent).toFixed(2)}%
        </p>
      )}
    </div>
  )
}

function getDailyVariation(currentValue, previousValue) {
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
