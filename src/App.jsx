import { useState } from 'react'
import CalculatorInput from './components/CalculatorInput.jsx'
import ResultDisplay from './components/ResultDisplay.jsx'
import { fetchBCVRate, getFriendlyErrorMessage } from './services/apiService.js'

export default function App() {
  const [mode, setMode] = useState('bs-to-usd')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleToggleMode() {
    setMode(prev => (prev === 'bs-to-usd' ? 'usd-to-bs' : 'bs-to-usd'))
    // Al cambiar dirección, el resultado anterior ya no aplica
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
        ? amount / rate.tasa   // Bs → USD: divide
        : amount * rate.tasa   // USD → Bs: multiplica

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
        <p className="app-subtitle">Convierte bolívares y dólares</p>
      </header>

      <section className="app-content">
        <CalculatorInput
          mode={mode}
          onCalculate={handleCalculate}
          onToggleMode={handleToggleMode}
          disabled={loading}
        />
        <ResultDisplay result={result} loading={loading} error={error} mode={mode} />
      </section>

      <footer className="app-footer">
        <p className="footer-text">Tasa del BCV · Venezuela</p>
      </footer>
    </main>
  )
}
