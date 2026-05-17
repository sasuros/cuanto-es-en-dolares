import { useState } from 'react'
import CalculatorInput from './components/CalculatorInput.jsx'
import ResultDisplay from './components/ResultDisplay.jsx'
import { fetchBCVRate, getFriendlyErrorMessage } from './services/apiService.js'

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCalculate(bolivares) {
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const rate = await fetchBCVRate()
      setResult({
        bolivares,
        usd: bolivares / rate.tasa,
        tasa: rate.tasa,
        fecha: rate.fecha,
        fetchedAt: rate.fetchedAt,
        fromCache: rate.fromCache,
        stale: rate.stale
      })
    } catch (err) {
      console.error('[App] Error al consultar tasa:', err)
      setError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">¿Cuánto es en Dólares?</h1>
        <p className="app-subtitle">Convierte bolívares a dólares</p>
      </header>

      <section className="app-content">
        <CalculatorInput onCalculate={handleCalculate} disabled={loading} />
        <ResultDisplay result={result} loading={loading} error={error} />
      </section>

      <footer className="app-footer">
        <p className="footer-text">Tasa del BCV · Venezuela</p>
      </footer>
    </main>
  )
}
