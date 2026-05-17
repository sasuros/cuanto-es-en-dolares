import { useState, useRef } from 'react'
import { formatBolivares, parseBolivares } from '../utils/formatters'

export default function CalculatorInput({ onCalculate, disabled = false }) {
  const [raw, setRaw] = useState('')
  const inputRef = useRef(null)

  const formatted = formatBolivares(raw)
  const hasValue = raw.length > 0
  const isButtonDisabled = disabled || !hasValue

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '')
    setRaw(digits)
  }

  function handleClear() {
    setRaw('')
    inputRef.current?.focus()
  }

  function handleCalculate() {
    const amount = parseBolivares(raw)
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
      <label className="calculator-input__label" htmlFor="bolivares-input">
        ¿Cuántos bolívares?
      </label>

      <div className="calculator-input__field-wrapper">
        <input
          ref={inputRef}
          id="bolivares-input"
          className="calculator-input__field"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder="0"
          value={formatted}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="Cantidad en bolívares"
          aria-describedby="bolivares-currency"
        />

        <span id="bolivares-currency" className="calculator-input__currency">
          Bs
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
