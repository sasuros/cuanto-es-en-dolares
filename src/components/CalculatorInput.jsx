import { useState, useRef, useEffect } from 'react'
import {
  formatBolivares,
  parseBolivares,
  formatUSDInput,
  parseUSDInput
} from '../utils/formatters'

/**
 * Input bidireccional Bs ↔ USD con auto-cálculo.
 *
 * v0.4.0:
 * - Sin botón CALCULAR (auto-calcula con debounce 300ms al escribir)
 * - Sin toggle "⇄ Cambiar a..." (movido a ModeSelector externo)
 * - Quick chips de montos comunes (validados con usuario)
 * - Botón X conservado (limpia input + resultado)
 *
 * mode = 'bs-to-usd' → formato venezolano (1.500.000), teclado numérico
 * mode = 'usd-to-bs' → formato americano (1,500.50), teclado decimal
 */

const DEBOUNCE_MS = 300

// Montos comunes (validados visualmente con usuario en mockup)
const QUICK_CHIPS_BS = [100, 500, 1000, 5000, 10000]
const QUICK_CHIPS_USD = [1, 5, 10, 20, 50]

export default function CalculatorInput({
  mode,
  onCalculate,
  onClear,
  disabled = false
}) {
  const [raw, setRaw] = useState('')
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const isBsMode = mode === 'bs-to-usd'

  // Limpia el input cuando cambia el modo (evita arrastrar valor entre monedas)
  useEffect(() => {
    setRaw('')
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    onClear?.()
    // No agregamos onClear a deps porque es estable por uso; el efecto debe
    // correr solo cuando cambia el modo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Cleanup del timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const formatted = isBsMode ? formatBolivares(raw) : formatUSDInput(raw)
  const hasValue = raw.length > 0
  const chips = isBsMode ? QUICK_CHIPS_BS : QUICK_CHIPS_USD

  function scheduleCalculation(currentRaw) {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (currentRaw === '' || currentRaw === '.') {
      // Input vacío → vuelve InitialRateCard
      onClear?.()
      return
    }

    debounceRef.current = setTimeout(() => {
      const amount = isBsMode ? parseBolivares(currentRaw) : parseUSDInput(currentRaw)
      if (amount > 0) onCalculate(amount)
    }, DEBOUNCE_MS)
  }

  function handleChange(e) {
    const value = e.target.value
    let cleaned

    if (isBsMode) {
      cleaned = value.replace(/\D/g, '')
    } else {
      const noJunk = value.replace(/[^\d.]/g, '')
      const firstDot = noJunk.indexOf('.')
      if (firstDot === -1) {
        cleaned = noJunk
      } else {
        const intPart = noJunk.slice(0, firstDot)
        const decPart = noJunk.slice(firstDot + 1).replace(/\./g, '').slice(0, 2)
        cleaned = intPart + '.' + decPart
      }
    }

    setRaw(cleaned)
    scheduleCalculation(cleaned)
  }

  function handleClear() {
    setRaw('')
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    inputRef.current?.focus()
    onClear?.()
  }

  function handleChipClick(value) {
    const newRaw = String(value)
    setRaw(newRaw)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    // Chip click es explícito → cálculo inmediato (sin debounce)
    const amount = isBsMode ? parseBolivares(newRaw) : parseUSDInput(newRaw)
    if (amount > 0) onCalculate(amount)
  }

  function formatChipLabel(value) {
    if (isBsMode) {
      return `${formatBolivares(value)} Bs`
    }
    return `$${value}`
  }

  return (
    <div className="calculator-input">
      <div className="calculator-input__field-wrapper">
        <input
          ref={inputRef}
          id="amount-input"
          className="calculator-input__field"
          type="text"
          inputMode={isBsMode ? 'numeric' : 'decimal'}
          pattern={isBsMode ? '[0-9]*' : '[0-9.]*'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder="0"
          value={formatted}
          onChange={handleChange}
          aria-label={isBsMode ? 'Cantidad en bolívares' : 'Cantidad en dólares'}
          aria-describedby="amount-currency"
          disabled={disabled}
        />

        {hasValue && (
          <button
            type="button"
            className="calculator-input__clear"
            onClick={handleClear}
            aria-label="Borrar cantidad"
            tabIndex={-1}
            disabled={disabled}
          >
            Borrar
          </button>
        )}

        <span id="amount-currency" className="calculator-input__currency">
          {isBsMode ? 'Bs' : '$'}
        </span>
      </div>

      <div className="quick-chips-container" role="group" aria-label="Montos rápidos">
        {chips.map((value) => (
          <button
            key={value}
            type="button"
            className="quick-chip"
            onClick={() => handleChipClick(value)}
            disabled={disabled}
          >
            {formatChipLabel(value)}
          </button>
        ))}
      </div>
    </div>
  )
}
