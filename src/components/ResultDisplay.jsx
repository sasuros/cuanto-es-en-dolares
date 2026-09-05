import { useEffect, useState } from 'react'
import {
  formatUSD,
  formatEUR,
  formatRate,
  formatRelativeTime,
  formatBolivares,
  getCleanCopyValue,
  getRateValidity
} from '../utils/formatters'
import { createTapeEntry } from '../utils/tape'

const TAPE_TOOLTIP_KEY = 'tape-tooltip-seen'

function readTapeTooltipSeen() {
  try {
    return localStorage.getItem(TAPE_TOOLTIP_KEY) === 'true'
  } catch {
    return true
  }
}

function writeTapeTooltipSeen() {
  try {
    localStorage.setItem(TAPE_TOOLTIP_KEY, 'true')
  } catch {
    // Si localStorage no esta disponible, el tooltip solo vive en esta sesion.
  }
}

export default function ResultDisplay({ result, loading, error, mode, onAddToTape }) {
  const [copied, setCopied] = useState(false)
  const [added, setAdded] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(() => !readTapeTooltipSeen())
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

  useEffect(() => {
    if (!added) return undefined

    const timeoutId = window.setTimeout(() => {
      setAdded(false)
    }, 1500)

    return () => window.clearTimeout(timeoutId)
  }, [added])

  useEffect(() => {
    if (!tooltipVisible) return undefined

    const timeoutId = window.setTimeout(() => {
      hideTapeTooltip(setTooltipVisible)
    }, 4500)

    return () => window.clearTimeout(timeoutId)
  }, [tooltipVisible])

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
    usdt,
    currency = 'usd',
    direction
  } = result

  const relativeTime = formatRelativeTime(fetchedAt)
  const isCustomMode = mode === 'custom'
  const validity = getRateValidity(fecha)
  const currencyName = currency === 'eur' ? 'euro' : 'dolar'
  const usdtRate = usdt || null
  const showUsdtResult =
    !isCustomMode &&
    currency === 'usd' &&
    usdtRate &&
    Number.isFinite(usdtRate.tasa) &&
    usdtRate.tasa > 0
  const convertedWithUsdt = showUsdtResult
    ? (direction === 'from-bs' ? amount / usdtRate.tasa : amount * usdtRate.tasa)
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

      <div className="result-display__actions">
        <button
          type="button"
          className={`copy-button${copied ? ' copy-button--copied' : ''}`}
          onClick={() => handleCopyResult(cleanCopyValue, setCopied)}
          aria-label={copied ? 'Resultado copiado' : 'Copiar resultado'}
        >
          {copied ? '✅ Copiado' : '📋 Copiar'}
        </button>

        <div className="add-to-tape-wrap">
          {tooltipVisible && (
            <div className="add-to-tape-tooltip" role="status">
              Suma varios calculos <span aria-hidden="true">⬇️</span>
            </div>
          )}
          <button
            type="button"
            className={`copy-button add-to-tape-button${added ? ' copy-button--copied' : ''}`}
            onClick={() => handleAddToTape(result, mode, onAddToTape, setAdded, setTooltipVisible)}
            aria-label={added ? 'Sumado a la cinta' : 'Sumar a mi cinta'}
          >
            {added ? '✅ Sumado' : '➕ Sumar'}
          </button>
        </div>
      </div>

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

      {showUsdtResult && (
        <>
          <div className="result-display__divider" aria-hidden="true" />

          <div className="reference-result">
            <ReferenceRateLine
              label="Con USDT:"
              value={convertedWithUsdt}
              rate={usdtRate.tasa}
              unit="Bs/USDT"
              resultIsForeign={resultIsForeign}
              currency={currency}
              tone="usdt"
            />
          </div>
        </>
      )}
    </div>
  )
}

function ReferenceRateLine({
  label,
  value,
  rate,
  unit,
  resultIsForeign,
  currency,
  tone = 'neutral'
}) {
  return (
    <div className={`reference-result__item reference-result__item--${tone}`}>
      <p className="reference-result__line">
        <span className="reference-result__label">{label}</span>
        <strong className="reference-result__value">
          {resultIsForeign
            ? formatForeignCurrency(value, currency)
            : `${formatBolivares(value)} Bs`}
        </strong>
      </p>
      <p className="reference-result__rate">
        ({formatRate(rate)} {unit})
      </p>
    </div>
  )
}

function getResultIsForeignCurrency(result, mode) {
  if (mode === 'custom') return result.customDirection === 'bs'
  return result.direction === 'from-bs'
}

function formatForeignCurrency(value, currency) {
  return currency === 'eur' ? formatEUR(value) : formatUSD(value)
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

function handleAddToTape(result, mode, onAddToTape, setAdded, setTooltipVisible) {
  if (!result || !onAddToTape) return

  onAddToTape(createTapeEntry(result, mode))
  setAdded(true)
  hideTapeTooltip(setTooltipVisible)
}

function hideTapeTooltip(setTooltipVisible) {
  writeTapeTooltipSeen()
  setTooltipVisible(false)
}
