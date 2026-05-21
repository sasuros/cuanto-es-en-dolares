import { useState, useEffect } from 'react'
import ModeSelector from './components/ModeSelector.jsx'
import CalculatorInput from './components/CalculatorInput.jsx'
import ResultDisplay from './components/ResultDisplay.jsx'
import InitialRateCard from './components/InitialRateCard.jsx'
import {
  fetchBCVRateForCalculation,
  getFriendlyErrorMessage
} from './services/apiService.js'

export default function App() {
  const [mode, setMode] = useState('bs-to-usd')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Tasa inicial (visible al abrir la app, sin necesidad de calcular)
  const [initialRate, setInitialRate] = useState(null)
  const [initialRateLoading, setInitialRateLoading] = useState(true)
  const [initialRateError, setInitialRateError] = useState(null)

  // Fetch automático al montar.
  // v0.4.0: usamos fetchBCVRateForCalculation para que la tasa mostrada
  // en InitialRateCard sea la MISMA que la app usaría para calcular
  // (single source of truth — sin discrepancias entre lo que ve y lo que calcula).
  useEffect(() => {
    let cancelled = false

    fetchBCVRateForCalculation()
      .then(rate => {
        if (!cancelled) setInitialRate(rate)
      })
      .catch(err => {
        if (cancelled) return
        console.error('[App] Error al cargar tasa inicial:', err)
        if (err?.code === 'NO_VALID_RATE') {
          // Caso especial: API publicó tasa futura y no hay caché válido.
          // Pasamos error tipado con info de la tasa de mañana.
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
        fetchedAt: rate.fetchedAt,
        fromCache: rate.fromCache,
        stale: rate.stale,
        isFallbackFromFuture: rate.isFallbackFromFuture,
        publishedRateFuture: rate.publishedRateFuture
      })

      // Sincronizamos initialRate con la misma tasa vigente
      setInitialRate(rate)
      // Limpiamos el error de la tarjeta inicial si lo había
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

  const showResultArea = result !== null || loading || error !== null

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">¿Cuánto es?</h1>
        <p className="app-subtitle">Convierte bolívares BCV y dólares</p>
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
          onClear={handleClear}
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
          <InitialRateCard
            rate={initialRate}
            loading={initialRateLoading}
            error={initialRateError}
          />
        )}
      </section>

      <footer className="app-footer">
        <p className="footer-text">Tasa del BCV · Venezuela</p>
      </footer>
    </main>
  )
}
