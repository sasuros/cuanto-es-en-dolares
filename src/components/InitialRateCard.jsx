import {
  formatRate,
  formatRelativeTime,
  getRateValidity
} from '../utils/formatters'

/**
 * Tarjeta que muestra la tasa BCV vigente al abrir la app, ANTES de
 * que el usuario haga cualquier cálculo. Se reemplaza por ResultDisplay
 * cuando hay un resultado o un cálculo en curso.
 *
 * Reutiliza las mismas clases de result-display para mantener
 * consistencia visual con el card de resultado.
 */
export default function InitialRateCard({ rate, loading, error }) {
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

  // v0.4.0: estado especial NO_VALID_RATE — BCV publicó tasa futura y no
  // tenemos caché válido. Mostramos la tasa de mañana como INFO (no para calcular).
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

  return (
    <div
      className="result-display result-display--info"
      role="region"
      aria-label="Tasa actual del BCV"
    >
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
    </div>
  )
}
