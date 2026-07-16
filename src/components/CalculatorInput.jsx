import { useState, useRef, useEffect } from 'react'
import {
  formatBolivares,
  parseBolivares,
  formatUSDInput,
  parseUSDInput
} from '../utils/formatters'

const DEBOUNCE_MS = 300

const QUICK_CHIPS_BS = [500, 1000, 5000, 10000, 50000]
const QUICK_CHIPS_USD = [1, 5, 10, 20, 50]
const QUICK_CHIPS_USD_HIGH_RATE = [1, 5, 10, 20, 50, 100]
const QUICK_CHIPS_EUR = [1, 5, 10, 20, 50, 100]
const QUICK_CHIP_USD_EQUIVALENTS = [1, 5, 10, 20, 50]

const CUSTOM_RATE_KEY = 'custom-rate-last-used'
const CUSTOM_DIRECTION_KEY = 'custom-direction-last-used'
const CUSTOM_RATE_MIN = 1
const CUSTOM_RATE_MAX = 10000
const CUSTOM_RATE_PLACEHOLDER = '700'

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
  try { localStorage.setItem(CUSTOM_RATE_KEY, String(value)) } catch {}
}

function readSavedCustomDirection() {
  try {
    const dir = localStorage.getItem(CUSTOM_DIRECTION_KEY)
    return dir === 'usd' ? 'usd' : 'bs'
  } catch {
    return 'bs'
  }
}

function writeSavedCustomDirection(dir) {
  try { localStorage.setItem(CUSTOM_DIRECTION_KEY, dir) } catch {}
}

function sanitizeBsInputDecimal(value) {
  let cleaned = value.replace(/[^\d.,]/g, '')
  if (!cleaned) return ''

  const commaIdx = cleaned.indexOf(',')

  if (commaIdx !== -1) {
    const intPart = cleaned.slice(0, commaIdx).replace(/\./g, '')
    const decPart = cleaned.slice(commaIdx + 1).replace(/[^\d]/g, '').slice(0, 2)
    return intPart + ',' + decPart
  }

  const lastDotIdx = cleaned.lastIndexOf('.')
  if (lastDotIdx === -1) return cleaned

  const afterLastDot = cleaned.slice(lastDotIdx + 1)
  if (afterLastDot.length <= 2 && !afterLastDot.includes('.')) {
    const intPart = cleaned.slice(0, lastDotIdx).replace(/\./g, '')
    return intPart + ',' + afterLastDot
  }

  return cleaned.replace(/\./g, '')
}

function sanitizeUsdInput(value) {
  const noJunk = value.replace(/[^\d.]/g, '')
  const firstDot = noJunk.indexOf('.')
  if (firstDot === -1) return noJunk
  const intPart = noJunk.slice(0, firstDot)
  const decPart = noJunk.slice(firstDot + 1).replace(/\./g, '').slice(0, 2)
  return intPart + '.' + decPart
}

function getRoundingStep(amount) {
  if (amount < 1000) return 10
  if (amount < 10000) return 100
  if (amount < 20000) return 500
  return 1000
}

function roundChipAmount(amount) {
  const step = getRoundingStep(amount)
  return Math.max(step, Math.round(amount / step) * step)
}

function getDynamicBsChips(bcvRate) {
  const rate = Number(bcvRate)
  if (!Number.isFinite(rate) || rate <= 0) return QUICK_CHIPS_BS

  return QUICK_CHIP_USD_EQUIVALENTS.map(usdAmount => roundChipAmount(usdAmount * rate))
}

export default function CalculatorInput({
  mode,
  onCalculate,
  onCustomCalculate,
  onClear,
  bcvRate = null,
  disabled = false
}) {
  const [raw, setRaw] = useState('')
  const [customTasaRaw, setCustomTasaRaw] = useState(() => readSavedCustomRate())
  const [customDirection, setCustomDirection] = useState(() => readSavedCustomDirection())
  const inputRef = useRef(null)
  const tasaInputRef = useRef(null)
  const debounceRef = useRef(null)

  const isBsMode = mode === 'bs-to-usd' || mode === 'bs-to-eur'
  const isUsdMode = mode === 'usd-to-bs'
  const isEurMode = mode === 'eur-to-bs'
  const isCustomMode = mode === 'custom'
  const customAmountIsBs = customDirection === 'bs'

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
    if (isCustomMode) {
      setRaw('')
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      onClear?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customDirection])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  let formatted
  if (isBsMode) {
    formatted = formatBolivares(raw)
  } else if (isUsdMode || isEurMode) {
    formatted = formatUSDInput(raw)
  } else if (isCustomMode) {
    formatted = customAmountIsBs ? formatBolivares(raw) : formatUSDInput(raw)
  }

  const hasValue = raw.length > 0
  const customTasaNum = parseFloat(customTasaRaw)
  const customTasaValid =
    Number.isFinite(customTasaNum) &&
    customTasaNum >= CUSTOM_RATE_MIN &&
    customTasaNum <= CUSTOM_RATE_MAX

  function scheduleCalculation(currentRaw, currentTasaRaw, currentDirection) {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (currentRaw === '' || currentRaw === '.' || currentRaw === ',') {
      onClear?.()
      return
    }

    debounceRef.current = setTimeout(() => {
      if (isCustomMode) {
        const tasa = parseFloat(currentTasaRaw)
        const amount = currentDirection === 'bs'
          ? parseBolivares(currentRaw)
          : parseUSDInput(currentRaw)
        if (
          amount > 0 &&
          Number.isFinite(tasa) &&
          tasa >= CUSTOM_RATE_MIN &&
          tasa <= CUSTOM_RATE_MAX
        ) {
          writeSavedCustomRate(tasa)
          onCustomCalculate?.(amount, tasa, currentDirection)
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

  function handleChange(e) {
    const value = e.target.value
    const cleaned = isUsdMode || isEurMode || (isCustomMode && !customAmountIsBs)
      ? sanitizeUsdInput(value)
      : sanitizeBsInputDecimal(value)

    setRaw(cleaned)
    scheduleCalculation(cleaned, customTasaRaw, customDirection)
  }

  function handleTasaChange(e) {
    const cleaned = sanitizeUsdInput(e.target.value)
    setCustomTasaRaw(cleaned)
    scheduleCalculation(raw, cleaned, customDirection)
  }

  function handleDirectionChange(newDirection) {
    if (newDirection === customDirection) return
    setCustomDirection(newDirection)
    writeSavedCustomDirection(newDirection)
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
    if (isEurMode) return `€${value}`
    return `$${value}`
  }

  if (isCustomMode) {
    return (
      <div className="calculator-input calculator-input--custom">
        <div className="custom-direction">
          <p className="custom-direction__label">¿Yo tengo?</p>
          <div
            className="custom-direction__group"
            role="radiogroup"
            aria-label="Direccion de conversion con tasa custom"
          >
            <button
              type="button"
              role="radio"
              aria-checked={customAmountIsBs}
              className={
                'custom-direction__btn' +
                (customAmountIsBs ? ' custom-direction__btn--active' : '')
              }
              onClick={() => handleDirectionChange('bs')}
              disabled={disabled}
            >
              Bolívares (Bs)
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!customAmountIsBs}
              className={
                'custom-direction__btn' +
                (!customAmountIsBs ? ' custom-direction__btn--active' : '')
              }
              onClick={() => handleDirectionChange('usd')}
              disabled={disabled}
            >
              Dólares ($)
            </button>
          </div>
        </div>

        <div className="calculator-input__field-wrapper">
          <input
            ref={inputRef}
            id="amount-input"
            className="calculator-input__field"
            type="text"
            inputMode="decimal"
            pattern="[0-9.,]*"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            placeholder="0"
            value={formatted}
            onChange={handleChange}
            aria-label={customAmountIsBs ? 'Cantidad en bolívares' : 'Cantidad en dólares'}
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

          <span className="calculator-input__currency">
            {customAmountIsBs ? 'Bs' : '$'}
          </span>
        </div>

        <div className="calculator-input__tasa-row">
          <label className="calculator-input__tasa-label" htmlFor="custom-tasa-input">
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

  const chips = isBsMode
    ? getDynamicBsChips(bcvRate)
    : isEurMode
      ? QUICK_CHIPS_EUR
      : (Number(bcvRate) > 500 ? QUICK_CHIPS_USD_HIGH_RATE : QUICK_CHIPS_USD)

  return (
    <div className="calculator-input">
      <div className="calculator-input__field-wrapper">
        <input
          ref={inputRef}
          id="amount-input"
          className="calculator-input__field"
          type="text"
          inputMode="decimal"
          pattern="[0-9.,]*"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder="0"
          value={formatted}
          onChange={handleChange}
          aria-label={
            isBsMode
              ? 'Cantidad en bolívares'
              : isEurMode
                ? 'Cantidad en euros'
                : 'Cantidad en dólares'
          }
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
          {isBsMode ? 'Bs' : isEurMode ? '€' : '$'}
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
