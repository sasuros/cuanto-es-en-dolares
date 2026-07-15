import {
  formatRate,
  formatRelativeTime,
  getRateValidity
} from '../utils/formatters'

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
  const relativeTime = formatRelativeTime(rate.fetchedAt)
  const isFuture = rate.isFuture === true
  const showParalelo =
    paralelo &&
    Number.isFinite(paralelo.tasa) &&
    Number.isFinite(rate.tasa) &&
    rate.tasa > 0
  const gapPercent = showParalelo
    ? ((paralelo.tasa - rate.tasa) / rate.tasa) * 100
    : 0
  const showGap = showParalelo && Math.abs(gapPercent) >= 0.05
  const gapIsLower = gapPercent < 0

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

      <p className="result-display__label">Tasa BCV hoy</p>

      <p className="result-display__amount initial-rate-card__amount">
        {formatRate(rate.tasa)}
        <span className="initial-rate-card__currency"> Bs / $</span>
      </p>

      <div className="result-display__divider" aria-hidden="true" />

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
            Publicada: {rate.fecha}
          </p>
        )}

        {relativeTime && (
          <p className="result-display__updated">
            Consultada {relativeTime}
          </p>
        )}
      </div>

      {showParalelo && (
        <>
          <div className="result-display__divider" aria-hidden="true" />

          <div className="parallel-rate">
            <p className="parallel-rate__line">
              <span className="parallel-rate__label">Paralelo:</span>
              <strong className="parallel-rate__value">
                {formatRate(paralelo.tasa)} Bs/$
              </strong>
            </p>

            {showGap && (
              <p
                className={
                  'parallel-rate__gap ' +
                  (gapIsLower ? 'parallel-rate__gap--lower' : 'parallel-rate__gap--higher')
                }
              >
                {gapIsLower ? '↓' : '↑'} {Math.abs(gapPercent).toFixed(1)}%{' '}
                {gapIsLower ? 'menos' : 'más'} que BCV
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
