import {
  formatUSD,
  formatRate,
  formatRelativeTime,
  formatBolivares,
  getRateValidity
} from '../utils/formatters'

/**
 * Resultado de la conversión.
 *
 * Modos soportados:
 *   - 'bs-to-usd' → muestra "Son \$X por Y Bs"
 *   - 'usd-to-bs' → muestra "Son Y Bs por \$X"
 *   - 'custom'    → muestra resultado + tasa custom usada (no BCV)
 *
 * v0.4.1: si result.isFuture (la tasa BCV usada es para mañana),
 * mostramos un badge "Tasa de referencia" y permitimos calcular igual.
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

  // v0.4.1 corregido: tasa futura sin caché válido → NO calcular, mostrar info
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

  const {
    amount,
    converted,
    tasa,
    fecha,
    fetchedAt,
    isFuture,
    isFallbackFromFuture,
    publishedRateFuture,
    isCustomRate
  } = result

  const relativeTime = formatRelativeTime(fetchedAt)
  const isBsToUsd = mode === 'bs-to-usd'
  const isCustomMode = mode === 'custom'
  const validity = getRateValidity(fecha)

  return (
    <div
      className="result-display result-display--success"
      role="region"
      aria-live="polite"
      aria-label="Resultado de la conversión"
    >
      {isFuture && (
        <div className="result-display__future-badge" role="status">
          <span aria-hidden="true">⚠️</span>
          <span>Tasa de referencia · vigente mañana</span>
        </div>
      )}

      <p className="result-display__label">
        {isCustomMode ? 'Son' : isBsToUsd ? 'Son' : 'Necesitas'}
      </p>

      <p className="result-display__amount">
        {isCustomMode || isBsToUsd
          ? formatUSD(converted)
          : `${formatBolivares(converted)} Bs`}
      </p>

      <p className="result-display__bolivares">
        {isCustomMode || isBsToUsd ? (
          <>por <strong>{formatBolivares(amount)} Bs</strong></>
        ) : (
          <>por <strong>{formatUSD(amount)}</strong></>
        )}
      </p>

      <div className="result-display__divider" aria-hidden="true" />

      <div className="result-display__meta">
        {isCustomMode ? (
          <p className="result-display__rate">
            Tu tasa: <strong>{formatRate(tasa)}</strong> Bs por dólar
            {' '}
            <span className="result-display__custom-tag">(personalizada)</span>
          </p>
        ) : (
          <p className="result-display__rate">
            Tasa BCV: <strong>{formatRate(tasa)}</strong> Bs por dólar
          </p>
        )}

        {!isCustomMode && validity === 'today' && (
          <p className="result-display__validity result-display__validity--today">
            ✅ Vigente: HOY
          </p>
        )}
        {!isCustomMode && validity === 'future' && (
          <p className="result-display__validity result-display__validity--future">
            ⚠️ Vigente desde: mañana
          </p>
        )}

        {!isCustomMode && fecha && (
          <p className="result-display__date">
            Publicada: {fecha}
          </p>
        )}

        {!isCustomMode && relativeTime && (
          <p className="result-display__updated">
            Consultada {relativeTime}
          </p>
        )}

        {isFallbackFromFuture && publishedRateFuture && (
          <p className="result-display__published-future">
            ℹ️ BCV ya publicó la tasa de mañana:{' '}
            <strong>{formatRate(publishedRateFuture.tasa)}</strong> Bs/$
          </p>
        )}
      </div>
    </div>
  )
}
