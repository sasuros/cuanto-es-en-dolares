import { useEffect, useMemo, useRef, useState } from 'react'
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
  parseContextKey,
  splitAmount
} from '../utils/tape'
import ConfirmModal from './ConfirmModal.jsx'

const splitBsFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

function formatSplitBs(value) {
  return `${splitBsFormatter.format(value)} Bs`
}

const MIN_DIVIDER_PEOPLE = 2
const MAX_DIVIDER_PEOPLE = 50

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
  const [isTotalVisible, setIsTotalVisible] = useState(true)
  const [showDivider, setShowDivider] = useState(false)
  const [dividerPeople, setDividerPeople] = useState(MIN_DIVIDER_PEOPLE)
  const [dividerCopied, setDividerCopied] = useState(false)
  const sectionRef = useRef(null)
  const totalRef = useRef(null)
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

  useEffect(() => {
    const node = totalRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsTotalVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsTotalVisible(entry.isIntersecting),
      { threshold: 0.6 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [tape.length])

  useEffect(() => {
    if (!dividerCopied) return undefined
    const timeoutId = window.setTimeout(() => setDividerCopied(false), 1500)
    return () => window.clearTimeout(timeoutId)
  }, [dividerCopied])

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

  function handleScrollToTotal() {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const bsTotal = context.direction === 'from-bs' ? inputTotal : outputTotal
  const moneyTotal = context.direction === 'from-bs' ? outputTotal : inputTotal
  const moneySymbol = context.currency === 'eur' ? '€' : '$'

  const bsSplit = bsTotal === undefined ? null : splitAmount(bsTotal, dividerPeople)
  const moneySplit = moneyTotal === undefined ? null : splitAmount(moneyTotal, dividerPeople)
  const formatMoney = value => (context.currency === 'eur' ? formatEUR(value) : formatUSD(value))

  function handleIncrementPeople() {
    setDividerPeople(current => Math.min(MAX_DIVIDER_PEOPLE, current + 1))
  }

  function handleDecrementPeople() {
    setDividerPeople(current => Math.max(MIN_DIVIDER_PEOPLE, current - 1))
  }

  function buildDividerCopyText() {
    if (!bsSplit && !moneySplit) return ''

    const lines = [`Cuenta dividida entre ${dividerPeople}:`]
    const bsPart = bsSplit ? formatSplitBs(bsSplit.base) : 'No disponible'
    const moneyPart = moneySplit ? ` (${formatMoney(moneySplit.base)})` : ''
    lines.push(`Cada uno: ${bsPart}${moneyPart}`)

    if (bsSplit && !bsSplit.allEqual) {
      const verb = bsSplit.remainderCount === 1 ? 'paga' : 'pagan'
      lines.push(`(${bsSplit.remainderCount} ${verb} ${formatSplitBs(bsSplit.extra)})`)
    }

    return lines.join('\n')
  }

  function handleCopyDivider() {
    const text = buildDividerCopyText()
    if (!text) return
    onCopyTotal(text)
    setDividerCopied(true)
  }

  return (
    <>
      <section className="tape-card" aria-label="Sumatoria" data-mode={mode} ref={sectionRef}>
        <div className="tape-card__header">
          <div>
            <h2 className="tape-card__title">🧾 Sumatoria</h2>
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

        <div className="tape-total" ref={totalRef}>
          <div className="tape-total__block">
            <span className="tape-total__label">Total Bs</span>
            <strong className="tape-total__value tabular-nums">
              {bsTotal === undefined ? 'No disponible' : `${formatBolivares(bsTotal)} Bs`}
            </strong>
          </div>
          <div className="tape-total__block">
            <span className="tape-total__label">Total {moneySymbol}</span>
            <strong className="tape-total__value tape-total__value--money tabular-nums">
              {moneyTotal === undefined
                ? 'No disponible'
                : (context.currency === 'eur' ? formatEUR(moneyTotal) : formatUSD(moneyTotal))}
            </strong>
          </div>
        </div>

        {!showDivider && (
          <button
            type="button"
            className="tape-divider-toggle"
            onClick={() => setShowDivider(true)}
          >
            👥 Dividir cuenta
          </button>
        )}

        {showDivider && (
          <div className="tape-divider">
            <div className="tape-divider__stepper">
              <button
                type="button"
                className="tape-divider__stepper-btn"
                onClick={handleDecrementPeople}
                disabled={dividerPeople <= MIN_DIVIDER_PEOPLE}
                aria-label="Menos personas"
              >
                −
              </button>
              <span className="tape-divider__count tabular-nums">{dividerPeople}</span>
              <button
                type="button"
                className="tape-divider__stepper-btn"
                onClick={handleIncrementPeople}
                disabled={dividerPeople >= MAX_DIVIDER_PEOPLE}
                aria-label="Más personas"
              >
                +
              </button>
            </div>

            <div className="tape-divider__result">
              <span className="tape-divider__label">Cada uno paga</span>
              <strong className="tape-divider__amount tabular-nums">
                {bsSplit ? formatSplitBs(bsSplit.base) : 'No disponible'}
                {moneySplit ? ` (${formatMoney(moneySplit.base)})` : ''}
              </strong>
              {bsSplit && !bsSplit.allEqual && (
                <p className="tape-divider__note">
                  ({bsSplit.remainderCount} {bsSplit.remainderCount === 1 ? 'paga' : 'pagan'} {formatSplitBs(bsSplit.extra)})
                </p>
              )}
            </div>

            <div className="tape-divider__actions">
              <button
                type="button"
                className={`copy-button${dividerCopied ? ' copy-button--copied' : ''}`}
                onClick={handleCopyDivider}
                disabled={!bsSplit && !moneySplit}
              >
                {dividerCopied ? '✅ Copiado' : '📋 Copiar reparto'}
              </button>
              <button
                type="button"
                className="tape-card__clear"
                onClick={() => setShowDivider(false)}
              >
                ✕ Cerrar división
              </button>
            </div>
          </div>
        )}

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
            🗑️ Vaciar sumatoria
          </button>
        </div>

        <ConfirmModal
          open={clearModalOpen}
          title="Vaciar sumatoria"
          message="Esto elimina todos los calculos acumulados en esta sumatoria."
          confirmLabel="Vaciar sumatoria"
          cancelLabel="Cancelar"
          onConfirm={handleConfirmClear}
          onCancel={() => setClearModalOpen(false)}
        />
      </section>

      <button
        type="button"
        className={`tape-fab${isTotalVisible ? ' tape-fab--hidden' : ''}`}
        onClick={handleScrollToTotal}
        aria-hidden={isTotalVisible}
        tabIndex={isTotalVisible ? -1 : 0}
      >
        🧾 Ver sumatoria ({tape.length}) ↓
      </button>
    </>
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
