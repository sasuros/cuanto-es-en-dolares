import { useState, useEffect } from 'react'
import CalculatorInput from './components/CalculatorInput.jsx'
import ResultDisplay from './components/ResultDisplay.jsx'
import InitialRateCard from './components/InitialRateCard.jsx'
import { fetchBCVRate, getFriendlyErrorMessage } from './services/apiService.js'

export default function App() {
  const [mode, setMode] = useState('bs-to-usd')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Estado independiente para el card de tasa inicial (se muestra al abrir la app)
  const [initialRate, setInitialRate] = useState(null)
  const [initialRateLoading, setInitialRateLoading] = useState(true)
  const [initialRateError, setInitialRateError] = useState(null)

  // Fetch automático de la tasa al montar la app (usa caché si existe).
  // Esto le da al usuario una respuesta inmediata a "¿a cuánto está hoy?"
  // sin tener que escribir nada.
  useEffect(() => {
    let cancelled = false

    fetchBCVRate()
      .then(rate => {
        if (!cancelled) setInitialRate(rate)
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[App] Error al cargar tasa inicial:', err)
          setInitialRateError(getFriendlyErrorMessage(err))
        }
      })
      .finally(() => {
        if (!cancelled) setInitialRateLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  function handleToggleMode() {
    setMode(prev => (prev === 'bs-to-usd' ? 'usd-to-bs' : 'bs-to-usd'))
    setResult(null)
    setError(null)
  }

  // Limpia el resultado de cálculo (el card de tasa inicial reaparece)
  function handleClear() {
    setResult(null)
    setError(null)
  }

  async function handleCalculate(amount) {
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const rate = await fetchBCVRate()
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
        stale: rate.stale
      })

      // Sincronizamos initialRate con la última tasa (por si la usuaria
      // limpia el resultado y vuelve a ver el card — sale más fresco)
      setInitialRate(rate)
    } catch (err) {
      console.error('[App] Error al consultar tasa:', err)
      setError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Determinamos qué mostrar en el área de "card inferior":
  //   - Si hay resultado / loading / error de cálculo → ResultDisplay
  //   - Si no → InitialRateCard (con tasa actual, su loading o su error)
  const showResultArea = result !== null || loading || error !== null

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">¿Cuánto es en Dólares?</h1>
        <p className="app-subtitle">Convierte bolívares y dólares</p>
      </header>

      <section className="app-content">
        <CalculatorInput
          mode={mode}
          onCalculate={handleCalculate}
          onToggleMode={handleToggleMode}
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
