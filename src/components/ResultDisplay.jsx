import { useEffect, useState } from 'react'
import {
  formatUSD,
  formatRate,
  formatRelativeTime,
  formatBolivares,
  getRateValidity
} from '../utils/formatters'

const euroFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export default function ResultDisplay({ result, loading, error, mode }) {
  const [copied, setCopied] = useState(false)
  const resultIsForeign = result ? getResultIsForeignCurrency(result, mode) : false
  const cleanCopyValue = result
    ? getCleanCopyValue(result.converted, resultIsForeign)
    : ''

  useEffect(() => {
    if (!copied) return undefined

    const timeoutId = window.setTimeout(() => {
      setCopied(false)
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [copied])

  useEffect(() => {
    setCopied(false)
  }, [cleanCopyValue])

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
        <p className="result-display__loading-text">Buscando tasa actual...</p>
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

  if (error) {
    const message = typeof error === 'string' ? error : (error?.message || 'Algo salio mal.')
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
    paralelo,
    currency = 'usd',
    direction
  } = result

  const relativeTime = formatRelativeTime(fetchedAt)
  const isCustomMode = mode === 'custom'
  const validity = getRateValidity(fecha)
  const unit = currency === 'eur' ? 'Bs/€' : 'Bs/$'
  const currencyName = currency === 'eur' ? 'euro' : 'dolar'
  const parallelRate = paralelo || null
  const showParallelResult =
    !isCustomMode &&
    parallelRate &&
    Number.isFinite(parallelRate.tasa) &&
    parallelRate.tasa > 0
  const convertedWithParallel = showParallelResult
    ? (direction === 'from-bs' ? amount / parallelRate.tasa : amount * parallelRate.tasa)
    : null

  return (
    <div
      className="result-display result-display--success"
      role="region"
      aria-live="polite"
      aria-label="Resultado de la conversion"
    >
      {isFuture && (
        <div className="result-display__future-badge" role="status">
          <span aria-hidden="true">⚠️</span>
          <span>Tasa de referencia · vigente manana</span>
        </div>
      )}

      <p className="result-display__label">
        {resultIsForeign ? 'Son' : 'Necesitas'}
      </p>

      <p className="result-display__amount">
        {resultIsForeign
          ? formatForeignCurrency(converted, currency)
          : `${formatBolivares(converted)} Bs`}
      </p>

      <button
        type="button"
        className={`copy-button${copied ? ' copy-button--copied' : ''}`}
        onClick={() => handleCopyResult(cleanCopyValue, setCopied)}
        aria-label={copied ? 'Resultado copiado' : 'Copiar resultado'}
      >
        {copied ? '✅ Copiado' : '📋 Copiar'}
      </button>

      <p className="result-display__bolivares">
        {resultIsForeign ? (
          <>por <strong>{formatBolivares(amount)} Bs</strong></>
        ) : (
          <>por <strong>{formatForeignCurrency(amount, currency)}</strong></>
        )}
      </p>

      <div className="result-display__divider" aria-hidden="true" />

      <div className="result-display__meta">
        {isCustomMode ? (
          <p className="result-display__rate">
            Con tu tasa: <strong>{formatRate(tasa)}</strong> Bs/$
            {' '}
            <span className="result-display__custom-tag">(personalizada)</span>
          </p>
        ) : (
          <p className="result-display__rate">
            Tasa BCV: <strong>{formatRate(tasa)}</strong> Bs por {currencyName}
          </p>
        )}

        {!isCustomMode && validity === 'today' && (
          <p className="result-display__validity result-display__validity--today">
            ✅ Vigente: HOY
          </p>
        )}
        {!isCustomMode && validity === 'future' && (
          <p className="result-display__validity result-display__validity--future">
            ⚠️ Vigente desde: manana
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
            BCV ya publico la tasa de manana:{' '}
            <strong>{formatRate(publishedRateFuture.tasa)}</strong> Bs/$
          </p>
        )}
      </div>

      {showParallelResult && (
        <>
          <div className="result-display__divider" aria-hidden="true" />

          <div className="parallel-result">
            <p className="parallel-result__line">
              <span className="parallel-result__label">Con paralelo:</span>
              <strong className="parallel-result__value">
                {resultIsForeign
                  ? formatForeignCurrency(convertedWithParallel, currency)
                  : `${formatBolivares(convertedWithParallel)} Bs`}
              </strong>
            </p>
            <p className="parallel-result__rate">
              ({formatRate(parallelRate.tasa)} {unit})
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function getResultIsForeignCurrency(result, mode) {
  if (mode === 'custom') return result.customDirection === 'bs'
  return result.direction === 'from-bs'
}

function formatForeignCurrency(value, currency) {
  return currency === 'eur' ? euroFormatter.format(value) : formatUSD(value)
}

function getCleanCopyValue(value, resultIsForeign) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return ''

  if (resultIsForeign) {
    return numericValue.toFixed(2)
  }

  return Number.isInteger(numericValue)
    ? String(numericValue)
    : String(Number(numericValue.toFixed(2)))
}

async function handleCopyResult(cleanNumber, setCopied) {
  if (!cleanNumber) return

  try {
    await navigator.clipboard.writeText(cleanNumber)
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = cleanNumber
    textArea.setAttribute('readonly', '')
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }

  setCopied(true)
}
