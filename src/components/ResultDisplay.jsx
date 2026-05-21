import {
  formatUSD,
  formatRate,
  formatRelativeTime,
  formatBolivares,
  getRateValidity
} from '../utils/formatters'

/**
 * Resultado de la conversión bidireccional.
 * mode = 'bs-to-usd': muestra "$X por Y Bs"
 * mode = 'usd-to-bs': muestra "Y Bs para $X"
 */
export default function ResultDisplay({ result, loading, error, mode }) {
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
        <p className="result-display__loading-text">Buscando tasa actual…</p>
      </div>
    )
  }

  // v0.4.0: NO_VALID_RATE — mostrar tasa de mañana como info, sin calcular
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

  if (error) {
    const message = typeof error === 'string' ? error : (error?.message || 'Algo salió mal.')
    return (
      <div
        className="result-display result-display--error"
        role="alert"
        aria-live="assertive"
      >
        <p className="result-display__error-icon" aria-hidden="true">⚠️</p>
        <p className="result-display__error-text">{message}</p>
      </div>
    )
  }

  if (!result) return null

  const { amount, converted, tasa, fecha, fetchedAt } = result
  const relativeTime = formatRelativeTime(fetchedAt)
  const isBsToUsd = mode === 'bs-to-usd'
  const validity = getRateValidity(fecha)

  return (
    <div
      className="result-display result-display--success"
      role="region"
      aria-live="polite"
      aria-label="Resultado de la conversión"
    >
      <p className="result-display__label">
        {isBsToUsd ? 'Son' : 'Necesitas'}
      </p>

      <p className="result-display__amount">
        {isBsToUsd ? formatUSD(converted) : `${formatBolivares(converted)} Bs`}
      </p>

      <p className="result-display__bolivares">
        {isBsToUsd ? (
          <>por <strong>{formatBolivares(amount)} Bs</strong></>
        ) : (
          <>para <strong>{formatUSD(amount)}</strong></>
        )}
      </p>

      <div className="result-display__divider" aria-hidden="true" />

      <div className="result-display__meta">
        <p className="result-display__rate">
          Tasa BCV: <strong>{formatRate(tasa)}</strong> Bs por dólar
        </p>

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

        {fecha && (
          <p className="result-display__date">
            Publicada: {fecha}
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
