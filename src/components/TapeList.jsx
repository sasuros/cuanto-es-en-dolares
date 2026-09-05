import { useMemo, useState } from 'react'
import {
  formatBolivares,
  formatUSD,
  formatEUR,
  formatRate,
  getCleanCopyValue
} from '../utils/formatters'
import {
  buildTapeSnapshot,
  calculateTapeLine,
  getCurrentRateForContext,
  parseContextKey
} from '../utils/tape'
import ConfirmModal from './ConfirmModal.jsx'

export default function TapeList({
  tape,
  rates,
  result,
  mode,
  lastValidTapeSnapshot,
  onRemove,
  onClear,
  onCopyTotal
}) {
  const [clearModalOpen, setClearModalOpen] = useState(false)
  const activeContextKey = tape[0]?.contextKey || ''
  const context = parseContextKey(activeContextKey)
  const rate = getCurrentRateForContext(activeContextKey, rates, result)
  const liveSnapshot = useMemo(
    () => buildTapeSnapshot(tape, rate),
    [tape, rate]
  )
  const fallbackSnapshot = useMemo(
    () => buildFallbackSnapshot(tape, lastValidTapeSnapshot),
    [tape, lastValidTapeSnapshot]
  )

  if (tape.length === 0) return null
  const snapshot = liveSnapshot || fallbackSnapshot
  const usingFallback = !liveSnapshot && Boolean(snapshot)
  const inputTotal = tape.reduce((sum, item) => sum + Number(item.inputAmount || 0), 0)
  const outputTotal = snapshot?.outputTotal
  const outputIsForeign = context.direction === 'from-bs'
  const cleanCopyValue = outputTotal === undefined
    ? ''
    : getCleanCopyValue(outputTotal, outputIsForeign)

  function handleCopyTotal() {
    if (!cleanCopyValue) return
    onCopyTotal(cleanCopyValue)
  }

  function handleClearClick() {
    if (tape.length > 2) {
      setClearModalOpen(true)
      return
    }

    onClear()
  }

  function handleConfirmClear() {
    setClearModalOpen(false)
    onClear()
  }

  return (
    <section className="tape-card" aria-label="Mi cinta" data-mode={mode}>
      <div className="tape-card__header">
        <div>
          <h2 className="tape-card__title">🧾 Mi cinta</h2>
          <p className="tape-card__context">{getContextLabel(context)}</p>
        </div>
        <span className="tape-card__counter">{tape.length}</span>
      </div>

      {usingFallback && (
        <div className="tape-card__warning" role="status">
          <span aria-hidden="true">⚠️</span>
          <span>tasa no disponible</span>
        </div>
      )}

      {rate && (
        <p className="tape-card__rate">
          Tasa actual: <strong>{formatRate(rate)}</strong> Bs/{context.currency === 'eur' ? 'EUR' : 'USD'}
        </p>
      )}

      <div className="tape-list">
        {tape.map(item => (
          <TapeItem
            key={item.id}
            item={item}
            rate={rate}
            fallbackValue={snapshot?.lines?.find(line => line.id === item.id)?.value}
            onRemove={onRemove}
          />
        ))}
      </div>

      <div className="tape-total">
        <div className="tape-total__row">
          <span>Total entrada</span>
          <strong className="tape-total__input tabular-nums">
            {formatInputAmount(inputTotal, context)}
          </strong>
        </div>
        <div className="tape-total__row tape-total__row--destination">
          <span>Total destino</span>
          <strong className="tape-total__destination tabular-nums">
            {outputTotal === undefined ? 'No disponible' : formatOutputAmount(outputTotal, context)}
          </strong>
        </div>
      </div>

      <div className="tape-card__actions">
        <button
          type="button"
          className="copy-button"
          onClick={handleCopyTotal}
          disabled={!cleanCopyValue}
        >
          📋 Copiar total
        </button>
        <button
          type="button"
          className="tape-card__clear"
          onClick={handleClearClick}
        >
          🗑️ Vaciar cinta
        </button>
      </div>

      <ConfirmModal
        open={clearModalOpen}
        title="Vaciar cinta"
        message="Esto elimina todos los calculos acumulados en esta cinta."
        confirmLabel="Vaciar cinta"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmClear}
        onCancel={() => setClearModalOpen(false)}
      />
    </section>
  )
}

function TapeItem({ item, rate, fallbackValue, onRemove }) {
  const context = parseContextKey(item.contextKey)
  const liveValue = rate ? calculateTapeLine(item, rate) : null
  const value = liveValue ?? fallbackValue

  return (
    <div className="tape-item">
      <div className="tape-item__amounts">
        <p className="tape-item__input tabular-nums">
          {formatInputAmount(item.inputAmount, context)}
        </p>
        <p className="tape-item__output tabular-nums">
          {value === undefined || value === null ? 'No disponible' : formatOutputAmount(value, context)}
        </p>
      </div>
      <button
        type="button"
        className="tape-item__remove"
        onClick={() => onRemove(item.id)}
        aria-label="Eliminar de la cinta"
      >
        ❌
      </button>
    </div>
  )
}

function buildFallbackSnapshot(tape, lastValidTapeSnapshot) {
  if (!lastValidTapeSnapshot || tape.length === 0) return null

  const lines = tape.map(item => {
    const line = lastValidTapeSnapshot.lines?.find(snapshotLine => snapshotLine.id === item.id)
    return line ? { id: item.id, value: line.value } : null
  })

  if (lines.some(line => !line || !Number.isFinite(line.value))) {
    return null
  }

  return {
    contextKey: tape[0].contextKey,
    inputTotal: tape.reduce((sum, item) => sum + Number(item.inputAmount || 0), 0),
    outputTotal: lines.reduce((sum, line) => sum + line.value, 0),
    lines
  }
}

function formatInputAmount(value, context) {
  if (context.direction === 'to-bs') {
    return context.currency === 'eur' ? formatEUR(value) : formatUSD(value)
  }

  return `${formatBolivares(value)} Bs`
}

function formatOutputAmount(value, context) {
  if (context.direction === 'from-bs') {
    return context.currency === 'eur' ? formatEUR(value) : formatUSD(value)
  }

  return `${formatBolivares(value)} Bs`
}

function getContextLabel(context) {
  const source = context.source === 'custom' ? 'tasa personalizada' : 'BCV'
  const currency = context.currency === 'eur' ? 'Euro' : 'Dolar'
  const direction = context.direction === 'from-bs' ? 'desde Bs' : 'hacia Bs'

  return `${currency} ${source} · ${direction}`
}
