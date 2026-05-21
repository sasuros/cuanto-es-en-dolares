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

  // Tasa inicial (visible al abrir la app)
  const [initialRate, setInitialRate] = useState(null)
  const [initialRateLoading, setInitialRateLoading] = useState(true)
  const [initialRateError, setInitialRateError] = useState(null)

  // Fetch automático al montar (la única tasa que NO bloquea: si futura,
  // marca isFuture true y la app sigue funcional 24/7).
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
        isFuture: rate.isFuture,
        isFallbackFromFuture: rate.isFallbackFromFuture,
        publishedRateFuture: rate.publishedRateFuture
      })

      // Sincronizamos initialRate con la tasa más reciente
      setInitialRate(rate)
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

  // Modo custom: calcula con la tasa que el usuario ingresa (sin API).
  // Solo Bs → USD por ahora.
  function handleCustomCalculate(amount, customTasa) {
    setError(null)
    setLoading(false) // no hay API call

    const converted = amount / customTasa
    setResult({
      mode: 'custom',
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
