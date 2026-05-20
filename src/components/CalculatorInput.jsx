import { useState, useRef, useEffect } from 'react'
import {
  formatBolivares,
  parseBolivares,
  formatUSDInput,
  parseUSDInput
} from '../utils/formatters'

/**
 * Input bidireccional Bs ↔ USD.
 * - mode = 'bs-to-usd': usuario ingresa Bs, formato venezolano (1.500.000)
 * - mode = 'usd-to-bs': usuario ingresa USD, formato americano (1,500.50)
 *
 * El estado del modo vive en App (single source of truth).
 * Al cambiar de modo, el input se limpia automáticamente.
 */
export default function CalculatorInput({
  mode,
  onCalculate,
  onToggleMode,
  disabled = false
}) {
  const [raw, setRaw] = useState('')
  const inputRef = useRef(null)

  const isBsMode = mode === 'bs-to-usd'

  // Limpia el input cuando cambia el modo (evita arrastrar valor entre monedas)
  useEffect(() => {
    setRaw('')
  }, [mode])

  const formatted = isBsMode ? formatBolivares(raw) : formatUSDInput(raw)
  const hasValue = raw.length > 0
  const isButtonDisabled = disabled || !hasValue

  function handleChange(e) {
    const value = e.target.value
    if (isBsMode) {
      // Bs: solo dígitos
      setRaw(value.replace(/\D/g, ''))
    } else {
      // USD: dígitos + un punto decimal, máximo 2 decimales
      const cleaned = value.replace(/[^\d.]/g, '')
      const firstDot = cleaned.indexOf('.')
      if (firstDot === -1) {
        setRaw(cleaned)
      } else {
        const intPart = cleaned.slice(0, firstDot)
        const decPart = cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, 2)
        setRaw(intPart + '.' + decPart)
      }
    }
  }

  function handleClear() {
    setRaw('')
    inputRef.current?.focus()
  }

  function handleCalculate() {
    const amount = isBsMode ? parseBolivares(raw) : parseUSDInput(raw)
    if (amount > 0) onCalculate(amount)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !isButtonDisabled) {
      e.preventDefault()
      handleCalculate()
    }
  }

  return (
    <div className="calculator-input">
      <label className="calculator-input__label" htmlFor="amount-input">
        {isBsMode ? '¿Cuántos bolívares?' : '¿Cuántos dólares?'}
      </label>

      <button
        type="button"
        className="calculator-input__toggle"
        onClick={onToggleMode}
        disabled={disabled}
        aria-label={
          isBsMode
            ? 'Cambiar a conversión de dólares a bolívares'
            : 'Cambiar a conversión de bolívares a dólares'
        }
      >
        <span className="calculator-input__toggle-icon" aria-hidden="true">⇄</span>
        <span className="calculator-input__toggle-text">
          {isBsMode ? 'Cambiar a dólares' : 'Cambiar a bolívares'}
        </span>
      </button>

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
          onKeyDown={handleKeyDown}
          aria-label={isBsMode ? 'Cantidad en bolívares' : 'Cantidad en dólares'}
          aria-describedby="amount-currency"
        />

        <span id="amount-currency" className="calculator-input__currency">
          {isBsMode ? 'Bs' : '$'}
        </span>

        {hasValue && (
          <button
            type="button"
            className="calculator-input__clear"
            onClick={handleClear}
            aria-label="Borrar cantidad"
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>

      <button
        type="button"
        className="calculator-input__button"
        onClick={handleCalculate}
        disabled={isButtonDisabled}
      >
        CALCULAR
      </button>
    </div>
  )
}
