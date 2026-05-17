import { formatUSD, formatRate, formatRelativeTime, formatBolivares } from '../utils/formatters'

export default function ResultDisplay({ result, loading, error }) {
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

  if (error) {
    return (
      <div
        className="result-display result-display--error"
        role="alert"
        aria-live="assertive"
      >
        <p className="result-display__error-icon" aria-hidden="true">⚠️</p>
        <p className="result-display__error-text">{error}</p>
      </div>
    )
  }

  if (!result) return null

  const { bolivares, usd, tasa, fecha, fetchedAt } = result
  const relativeTime = formatRelativeTime(fetchedAt)

  return (
    <div
      className="result-display result-display--success"
      role="region"
      aria-live="polite"
      aria-label="Resultado de la conversión"
    >
      <p className="result-display__label">Son aproximadamente</p>

      <p className="result-display__amount">
        {formatUSD(usd)}
      </p>

      <p className="result-display__bolivares">
        por <strong>{formatBolivares(bolivares)} Bs</strong>
      </p>

      <div className="result-display__divider" aria-hidden="true" />

      <div className="result-display__meta">
        <p className="result-display__rate">
          Tasa BCV: <strong>{formatRate(tasa)}</strong> Bs por dólar
        </p>
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
