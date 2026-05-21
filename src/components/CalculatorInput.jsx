import { useState, useRef, useEffect } from 'react'
import {
  formatBolivares,
  parseBolivares,
  formatUSDInput,
  parseUSDInput
} from '../utils/formatters'

/**
 * Input de cálculo. v0.4.1 soporta 3 modos:
 *   - 'bs-to-usd' → un input (Bs) + chips Bs
 *   - 'usd-to-bs' → un input (USD) + chips USD
 *   - 'custom'    → DOS inputs (monto Bs + tasa custom), sin chips
 *
 * El modo 'custom' usa una tasa que ingresa el usuario en lugar del BCV.
 * Se guarda la última tasa custom en localStorage para reuso.
 */

const DEBOUNCE_MS = 300

// v0.4.1: chips ajustados por feedback de la usuaria.
//   - "100 Bs no sirve para nada, empezar desde 500"
//   - Topes más altos para usuarios con valores en millones
const QUICK_CHIPS_BS = [500, 1000, 5000, 10000, 50000]
const QUICK_CHIPS_USD = [1, 5, 10, 20, 50]

// v0.4.1: persistencia del último tasa custom usada
const CUSTOM_RATE_KEY = 'custom-rate-last-used'
const CUSTOM_RATE_MIN = 1
const CUSTOM_RATE_MAX = 10000
const CUSTOM_RATE_PLACEHOLDER = '700' // USDT típico en VE

function readSavedCustomRate() {
  try {
    const raw = localStorage.getItem(CUSTOM_RATE_KEY)
    if (!raw) return ''
    const num = parseFloat(raw)
    if (!Number.isFinite(num) || num < CUSTOM_RATE_MIN || num > CUSTOM_RATE_MAX) return ''
    return raw
  } catch {
    return ''
  }
}

function writeSavedCustomRate(value) {
  try {
    localStorage.setItem(CUSTOM_RATE_KEY, String(value))
  } catch {
    // ignorar
  }
}

export default function CalculatorInput({
  mode,
  onCalculate,
  onCustomCalculate,
  onClear,
  disabled = false
}) {
  const [raw, setRaw] = useState('')
  const [customTasaRaw, setCustomTasaRaw] = useState(() => readSavedCustomRate())
  const inputRef = useRef(null)
  const tasaInputRef = useRef(null)
  const debounceRef = useRef(null)

  const isBsMode = mode === 'bs-to-usd'
  const isUsdMode = mode === 'usd-to-bs'
  const isCustomMode = mode === 'custom'

  // Limpia el monto cuando cambia el modo (no la tasa custom — eso es persistente)
  useEffect(() => {
    setRaw('')
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    onClear?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const formatted = isBsMode
    ? formatBolivares(raw)
    : isUsdMode
    ? formatUSDInput(raw)
    : formatBolivares(raw) // custom mode: amount es Bs

  const hasValue = raw.length > 0
  const customTasaNum = parseFloat(customTasaRaw)
  const customTasaValid =
    Number.isFinite(customTasaNum) &&
    customTasaNum >= CUSTOM_RATE_MIN &&
    customTasaNum <= CUSTOM_RATE_MAX

  function scheduleCalculation(currentRaw, currentTasaRaw) {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (currentRaw === '' || currentRaw === '.') {
      onClear?.()
      return
    }

    debounceRef.current = setTimeout(() => {
      if (isCustomMode) {
        const tasa = parseFloat(currentTasaRaw)
        const amount = parseBolivares(currentRaw)
        if (
          amount > 0 &&
          Number.isFinite(tasa) &&
          tasa >= CUSTOM_RATE_MIN &&
          tasa <= CUSTOM_RATE_MAX
        ) {
          writeSavedCustomRate(tasa)
          onCustomCalculate?.(amount, tasa)
        } else {
          onClear?.()
        }
      } else {
        const amount = isBsMode
          ? parseBolivares(currentRaw)
          : parseUSDInput(currentRaw)
        if (amount > 0) onCalculate(amount)
      }
    }, DEBOUNCE_MS)
  }

  function sanitizeBsInput(value) {
    return value.replace(/\D/g, '')
  }

  function sanitizeUsdInput(value) {
    const noJunk = value.replace(/[^\d.]/g, '')
    const firstDot = noJunk.indexOf('.')
    if (firstDot === -1) return noJunk
    const intPart = noJunk.slice(0, firstDot)
    const decPart = noJunk.slice(firstDot + 1).replace(/\./g, '').slice(0, 2)
    return intPart + '.' + decPart
  }

  function sanitizeTasaInput(value) {
    // tasa: decimal con hasta 2 decimales
    return sanitizeUsdInput(value)
  }

  function handleChange(e) {
    const value = e.target.value
    const cleaned = isUsdMode ? sanitizeUsdInput(value) : sanitizeBsInput(value)
    setRaw(cleaned)
    scheduleCalculation(cleaned, customTasaRaw)
  }

  function handleTasaChange(e) {
    const cleaned = sanitizeTasaInput(e.target.value)
    setCustomTasaRaw(cleaned)
    scheduleCalculation(raw, cleaned)
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
    const amount = isBsMode ? parseBolivares(newRaw) : parseUSDInput(newRaw)
    if (amount > 0) onCalculate(amount)
  }

  function formatChipLabel(value) {
    if (isBsMode) return `${formatBolivares(value)} Bs`
    return `$${value}`
  }

  // ====== Render: modo custom (dos inputs) ======
  if (isCustomMode) {
    return (
      <div className="calculator-input calculator-input--custom">
        <div className="calculator-input__field-wrapper">
          <input
            ref={inputRef}
            id="amount-input"
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
            aria-label="Cantidad en bolívares"
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

          <span className="calculator-input__currency">Bs</span>
        </div>

        <div className="calculator-input__tasa-row">
          <label
            className="calculator-input__tasa-label"
            htmlFor="custom-tasa-input"
          >
            ¿Tu tasa?
          </label>
          <div className="calculator-input__tasa-wrapper">
            <input
              ref={tasaInputRef}
              id="custom-tasa-input"
              className="calculator-input__tasa-field"
              type="text"
              inputMode="decimal"
              pattern="[0-9.]*"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              placeholder={CUSTOM_RATE_PLACEHOLDER}
              value={customTasaRaw}
              onChange={handleTasaChange}
              aria-label="Tasa personalizada en bolívares por dólar"
              disabled={disabled}
            />
            <span className="calculator-input__tasa-unit">Bs/$</span>
          </div>
        </div>

        {customTasaRaw && !customTasaValid && (
          <p className="calculator-input__tasa-hint" role="alert">
            Usa una tasa entre {CUSTOM_RATE_MIN} y {CUSTOM_RATE_MAX} Bs/$
          </p>
        )}
      </div>
    )
  }

  // ====== Render: modo BCV (Bs o USD) — un solo input + chips ======
  const chips = isBsMode ? QUICK_CHIPS_BS : QUICK_CHIPS_USD

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

      <div
        className="quick-chips-container"
        role="group"
        aria-label="Montos rápidos"
      >
        {chips.map(value => (
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
