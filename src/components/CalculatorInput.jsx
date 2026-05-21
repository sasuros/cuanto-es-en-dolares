import { useState, useRef, useEffect } from 'react'
import {
  formatBolivares,
  parseBolivares,
  formatUSDInput,
  parseUSDInput
} from '../utils/formatters'

/**
 * Input de cálculo. v0.4.2 soporta:
 *   - 'bs-to-usd' → un input Bs (ahora con decimales) + chips Bs
 *   - 'usd-to-bs' → un input USD + chips USD
 *   - 'custom'    → DOS inputs (monto + tasa), con sub-toggle Bs↔USD
 *
 * El modo 'custom' es bidireccional: el usuario elige si "tiene" Bs o $
 * y la tasa custom se aplica en la dirección que corresponde.
 */

const DEBOUNCE_MS = 300

const QUICK_CHIPS_BS = [500, 1000, 5000, 10000, 50000]
const QUICK_CHIPS_USD = [1, 5, 10, 20, 50]

// Persistencias del modo custom
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
    return dir === 'usd' ? 'usd' : 'bs' // default: bs
  } catch {
    return 'bs'
  }
}

function writeSavedCustomDirection(dir) {
  try { localStorage.setItem(CUSTOM_DIRECTION_KEY, dir) } catch {}
}

// v0.4.2.1: input Bs acepta decimales en formato es-VE (coma decimal,
// punto miles). El input es CONTROLLED con valor formateado — el
// formatter inserta puntos de miles, así que al recibir el siguiente
// keystroke, debemos distinguir miles de decimal:
//   - Si hay coma → la coma es el decimal (puntos = miles, los quitamos)
//   - Si no hay coma y un punto está seguido de 3+ dígitos → miles
//   - Si no hay coma y un punto está seguido de 0-2 dígitos → decimal en progreso
function sanitizeBsInputDecimal(value) {
  let cleaned = value.replace(/[^\d.,]/g, '')
  if (!cleaned) return ''

  const commaIdx = cleaned.indexOf(',')

  if (commaIdx !== -1) {
    // Ya hay coma → ella es la decimal. Cualquier punto previo es miles.
    const intPart = cleaned.slice(0, commaIdx).replace(/\./g, '')
    const decPart = cleaned.slice(commaIdx + 1).replace(/[^\d]/g, '').slice(0, 2)
    return intPart + ',' + decPart
  }

  // No hay coma. ¿Hay puntos?
  const lastDotIdx = cleaned.lastIndexOf('.')
  if (lastDotIdx === -1) {
    return cleaned // sólo dígitos, fácil
  }

  const afterLastDot = cleaned.slice(lastDotIdx + 1)
  if (afterLastDot.length <= 2 && !afterLastDot.includes('.')) {
    // "1." o "1.5" o "12.58" — el usuario quiere decimal con punto.
    // Convertimos el último punto en coma; el resto son miles.
    const intPart = cleaned.slice(0, lastDotIdx).replace(/\./g, '')
    return intPart + ',' + afterLastDot
  }

  // "1.205", "12.058", "1.500.000" — todos los puntos son miles.
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

export default function CalculatorInput({
  mode,
  onCalculate,
  onCustomCalculate,
  onClear,
  disabled = false
}) {
  const [raw, setRaw] = useState('')
  const [customTasaRaw, setCustomTasaRaw] = useState(() => readSavedCustomRate())
  const [customDirection, setCustomDirection] = useState(() => readSavedCustomDirection())
  const inputRef = useRef(null)
  const tasaInputRef = useRef(null)
  const debounceRef = useRef(null)

  const isBsMode = mode === 'bs-to-usd'
  const isUsdMode = mode === 'usd-to-bs'
  const isCustomMode = mode === 'custom'

  // En custom mode, el "modo del amount input" depende del sub-toggle
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

  // Si cambia la dirección dentro de custom, limpiar amount también
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

  // Cálculo del valor formateado para mostrar en el input
  let formatted
  if (isBsMode) {
    formatted = formatBolivares(raw)
  } else if (isUsdMode) {
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
    let cleaned
    if (isUsdMode || (isCustomMode && !customAmountIsBs)) {
      cleaned = sanitizeUsdInput(value)
    } else {
      // bs-to-usd O custom con dirección bs → ambos usan formato Bs con decimales
      cleaned = sanitizeBsInputDecimal(value)
    }
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
    // amount se limpia por el useEffect; resultado también
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

  // ====== Render: modo custom (dos inputs + sub-toggle Bs↔USD) ======
  if (isCustomMode) {
    return (
      <div className="calculator-input calculator-input--custom">
        <div className="custom-direction">
          <p className="custom-direction__label">¿Yo tengo?</p>
          <div
            className="custom-direction__group"
            role="radiogroup"
            aria-label="Dirección de conversión con tasa custom"
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

  // ====== Render: modos BCV (Bs o USD) — un input + chips ======
  const chips = isBsMode ? QUICK_CHIPS_BS : QUICK_CHIPS_USD

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
