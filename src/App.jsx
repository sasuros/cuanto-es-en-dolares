import { useState, useEffect } from 'react'
import ModeSelector from './components/ModeSelector.jsx'
import CalculatorInput from './components/CalculatorInput.jsx'
import ResultDisplay from './components/ResultDisplay.jsx'
import InitialRateCard from './components/InitialRateCard.jsx'
import {
  clearObsoleteRateCaches,
  fetchBCVRateForCalculation,
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
    // localStorage deshabilitado: el toggle sigue funcionando durante la sesión
  }
}

export default function App() {
  const [theme, setTheme] = useState(() => readThemePreference())
  const [mode, setMode] = useState('bs-to-usd')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Tasa inicial (visible al abrir la app)
  const [initialRate, setInitialRate] = useState(null)
  const [paraleloRate, setParaleloRate] = useState(null)
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
        console.warn('[App] No pudimos precargar el escáner OCR:', err)
        if (!cancelled) setOcrPreloadStatus('error')
      })

    return () => { cancelled = true }
  }, [])

  // Fetch automático al montar (la única tasa que NO bloquea: si futura,
  // marca isFuture true y la app sigue funcional 24/7).
  useEffect(() => {
    let cancelled = false

    clearObsoleteRateCaches()

    fetchBCVRateForCalculation()
      .then(rate => {
        if (!cancelled) {
          setInitialRate(rate)
          setParaleloRate(rate.paralelo || null)
        }
      })
      .catch(err => {
        if (cancelled) return
        console.error('[App] Error al cargar tasa inicial:', err)
        if (err?.code === 'NO_VALID_RATE') {
          // Sin tasa válida hoy + BCV publicó tasa de mañana →
          // mostramos info de mañana pero bloqueamos cálculos.
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
      const rate = await fetchBCVRateForCalculation()
      const converted = mode === 'bs-to-usd'
        ? amount / rate.tasa
        : amount * rate.tasa

      setResult({
        mode,
        amount,
        converted,
        tasa: rate.tasa,
        fecha: rate.fecha,
        paralelo: rate.paralelo || null,
        fetchedAt: rate.fetchedAt,
        fromCache: rate.fromCache,
        stale: rate.stale,
        isFuture: rate.isFuture,
        isFallbackFromFuture: rate.isFallbackFromFuture,
        publishedRateFuture: rate.publishedRateFuture
      })

      // Sincronizamos initialRate con la tasa más reciente
      setInitialRate(rate)
      setParaleloRate(rate.paralelo || null)
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
        setError(getFriendlyErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  // Modo custom v0.4.2: bidireccional (bs ↔ usd) con tasa propia.
  //   direction = 'bs'  → amount es Bs, resultado en USD (amount / tasa)
  //   direction = 'usd' → amount es USD, resultado en Bs (amount * tasa)
  function handleCustomCalculate(amount, customTasa, direction = 'bs') {
    setError(null)
    setLoading(false)

    const converted = direction === 'bs'
      ? amount / customTasa
      : amount * customTasa

    setResult({
      mode: 'custom',
      customDirection: direction,
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
        {/* v0.4.1: subtítulo eliminado por petición de la usuaria — innecesario */}
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
          bcvRate={initialRate?.tasa || null}
          ocrPreloadStatus={ocrPreloadStatus}
          disabled={loading}
        />

        {showResultArea ? (
          <ResultDisplay
            result={result}
            loading={loading}
            error={error}
            paralelo={paraleloRate}
            mode={mode}
          />
        ) : (
          <InitialRateCard
            rate={initialRate}
            paralelo={paraleloRate}
            loading={initialRateLoading}
            error={initialRateError}
          />
        )}
      </section>

      <footer className="app-footer">
        <p className="footer-text">Tasa del BCV · Venezuela</p>
        <p className="app-version">v0.8.1</p>
      </footer>
    </main>
  )
}
