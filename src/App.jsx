import { useState, useEffect } from 'react'
import ModeSelector from './components/ModeSelector.jsx'
import CalculatorInput from './components/CalculatorInput.jsx'
import ResultDisplay from './components/ResultDisplay.jsx'
import RateDashboard from './components/RateDashboard.jsx'
import {
  clearObsoleteRateCaches,
  fetchAllRatesForCalculation,
  getFriendlyErrorMessage
} from './services/apiService.js'

const THEME_STORAGE_KEY = 'theme-preference'

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function readThemePreference() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : getSystemTheme()
  } catch {
    return getSystemTheme()
  }
}

function writeThemePreference(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // localStorage deshabilitado: el toggle sigue funcionando durante la sesion
  }
}

export default function App() {
  const [theme, setTheme] = useState(() => readThemePreference())
  const [mode, setMode] = useState('bs-to-usd')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rates, setRates] = useState(null)
  const [initialRateLoading, setInitialRateLoading] = useState(true)
  const [initialRateError, setInitialRateError] = useState(null)
  const [ocrPreloadStatus, setOcrPreloadStatus] = useState('idle')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!query) return undefined

    function handleSystemThemeChange(event) {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY)
        if (stored === 'light' || stored === 'dark') return
      } catch {
        // Si no podemos leer preferencia, seguimos el sistema.
      }
      setTheme(event.matches ? 'light' : 'dark')
    }

    query.addEventListener?.('change', handleSystemThemeChange)
    return () => query.removeEventListener?.('change', handleSystemThemeChange)
  }, [])

  useEffect(() => {
    let cancelled = false

    setOcrPreloadStatus('loading')
    import('tesseract.js')
      .then(async ({ createWorker }) => {
        const worker = await createWorker('spa')
        await worker.terminate()
        if (!cancelled) setOcrPreloadStatus('ready')
      })
      .catch(err => {
        console.warn('[App] No pudimos precargar el escaner OCR:', err)
        if (!cancelled) setOcrPreloadStatus('error')
      })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false

    clearObsoleteRateCaches()

    fetchAllRatesForCalculation()
      .then(nextRates => {
        if (!cancelled) {
          setRates(nextRates)
        }
      })
      .catch(err => {
        if (cancelled) return
        console.error('[App] Error al cargar tasas iniciales:', err)
        if (err?.code === 'NO_VALID_RATE') {
          setInitialRateError({
            type: 'no_valid_rate',
            message: getFriendlyErrorMessage(err),
            futureRate: err.publishedRateFuture
          })
        } else {
          setInitialRateError(getFriendlyErrorMessage(err))
        }
      })
      .finally(() => {
        if (!cancelled) setInitialRateLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  function handleModeChange(newMode) {
    if (newMode === mode) return
    setMode(newMode)
    setResult(null)
    setError(null)
  }

  function handleClear() {
    setResult(null)
    setError(null)
  }

  function handleThemeToggle() {
    setTheme(current => {
      const next = current === 'dark' ? 'light' : 'dark'
      writeThemePreference(next)
      return next
    })
  }

  async function handleCalculate(amount) {
    setError(null)
    setLoading(true)

    try {
      const nextRates = await fetchAllRatesForCalculation()
      const currency = getModeCurrency(mode)
      const direction = getModeDirection(mode)
      const currencyRates = nextRates[currency]
      const rate = currencyRates?.bcv

      if (!rate?.tasa) {
        throw new Error(currency === 'eur'
          ? 'No pudimos consultar el euro. Intenta de nuevo en unos minutos.'
          : 'No pudimos consultar la tasa. Intenta de nuevo.')
      }

      const converted = direction === 'from-bs'
        ? amount / rate.tasa
        : amount * rate.tasa

      setResult({
        mode,
        currency,
        direction,
        amount,
        converted,
        tasa: rate.tasa,
        fecha: rate.fecha,
        paralelo: currencyRates.paralelo || null,
        fetchedAt: rate.fetchedAt,
        fromCache: nextRates.fromCache,
        stale: nextRates.stale,
        isFuture: rate.isFuture,
        isFallbackFromFuture: nextRates.isFallbackFromFuture,
        publishedRateFuture: nextRates.publishedRateFuture
      })

      setRates(nextRates)
      setInitialRateError(null)
    } catch (err) {
      console.error('[App] Error al consultar tasa:', err)
      if (err?.code === 'NO_VALID_RATE') {
        setError({
          type: 'no_valid_rate',
          message: getFriendlyErrorMessage(err),
          futureRate: err.publishedRateFuture
        })
      } else {
        setError(err?.message || getFriendlyErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  function handleCustomCalculate(amount, customTasa, direction = 'bs') {
    setError(null)
    setLoading(false)

    const converted = direction === 'bs'
      ? amount / customTasa
      : amount * customTasa

    setResult({
      mode: 'custom',
      customDirection: direction,
      currency: 'usd',
      direction: direction === 'bs' ? 'from-bs' : 'to-bs',
      amount,
      converted,
      tasa: customTasa,
      fecha: null,
      fetchedAt: Date.now(),
      isCustomRate: true
    })
  }

  const showResultArea = result !== null || loading || error !== null

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">¿Cuánto es?</h1>
        <button
          type="button"
          className="theme-toggle"
          onClick={handleThemeToggle}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
        >
          <span aria-hidden="true">{theme === 'dark' ? '🌙' : '☀️'}</span>
        </button>
      </header>

      <section className="app-content">
        <ModeSelector
          mode={mode}
          onChange={handleModeChange}
          disabled={loading}
        />

        <CalculatorInput
          mode={mode}
          onCalculate={handleCalculate}
          onCustomCalculate={handleCustomCalculate}
          onClear={handleClear}
          bcvRate={rates?.usd?.bcv?.tasa || null}
          ocrPreloadStatus={ocrPreloadStatus}
          disabled={loading}
        />

        {showResultArea ? (
          <ResultDisplay
            result={result}
            loading={loading}
            error={error}
            mode={mode}
          />
        ) : (
          <RateDashboard
            rates={rates}
            loading={initialRateLoading}
            error={initialRateError}
          />
        )}
      </section>

      <footer className="app-footer">
        <p className="footer-text">Tasa del BCV · Venezuela</p>
        <p className="app-version">v0.9.0</p>
      </footer>
    </main>
  )
}

function getModeCurrency(mode) {
  return mode === 'bs-to-eur' || mode === 'eur-to-bs' ? 'eur' : 'usd'
}

function getModeDirection(mode) {
  return mode === 'bs-to-usd' || mode === 'bs-to-eur' ? 'from-bs' : 'to-bs'
}
