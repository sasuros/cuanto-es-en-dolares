import { useEffect, useRef, useState } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { formatRate, todayInVenezuela } from '../utils/formatters'
import {
  fetchHistoricalSeries,
  fetchRateByDate,
  HISTORY_EARLIEST_DATE
} from '../services/historyService.js'
import TargetCurrencySelector from './TargetCurrencySelector.jsx'

const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

// Parseo manual, sin Date/timezone: la fecha es "YYYY-MM-DD" en el calendario
// de la API, no un instante. Pasarla por new Date() puede correrla un dia
// segun la zona horaria del navegador.
function formatShortDate(fechaISO) {
  const parts = String(fechaISO || '').split('-')
  if (parts.length !== 3) return fechaISO || ''

  const monthIdx = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  if (!Number.isFinite(day) || !SHORT_MONTHS[monthIdx]) return fechaISO

  return `${day} ${SHORT_MONTHS[monthIdx]}`
}

// Algoritmo de Sakamoto: dia de la semana a partir de y/m/d puros, sin
// Date/timezone (verificado contra referencia UTC para 5 fechas antes de usarlo).
function dayOfWeekSakamoto(year, month, day) {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  let y = year
  if (month < 3) y -= 1
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1] + day) % 7
}

function formatLongDate(fechaISO) {
  const parts = String(fechaISO || '').split('-')
  if (parts.length !== 3) return fechaISO || ''

  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  if (!Number.isFinite(year) || !SHORT_MONTHS[month - 1] || !Number.isFinite(day)) return fechaISO

  const weekday = WEEKDAYS[dayOfWeekSakamoto(year, month, day)]
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${capitalized}, ${day} ${SHORT_MONTHS[month - 1]} ${year}`
}

function formatGap(bcv, paralelo) {
  if (bcv == null || paralelo == null || !Number.isFinite(bcv) || bcv === 0) return ''
  const percent = ((paralelo - bcv) / bcv) * 100
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent.toFixed(1)}%`
}

function getTodayISO() {
  const { year, month, day } = todayInVenezuela()
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

// Recharts pasa los colores como atributos SVG (stroke/fill). var() en
// atributos de presentacion SVG no es confiable en todos los navegadores,
// asi que resolvemos el valor real de la CSS var con getComputedStyle y lo
// re-leemos cuando cambia el tema (data-theme en <html>).
function useCssVarColor(varName) {
  const [color, setColor] = useState('')

  useEffect(() => {
    function readColor() {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      if (value) setColor(value)
    }

    readColor()

    const observer = new MutationObserver(readColor)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [varName])

  return color
}

function HistoryTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  const symbol = currency === 'eur' ? 'EUR' : 'USD'

  return (
    <div className="history-tooltip">
      <p className="history-tooltip__date">{formatShortDate(label)}</p>
      {point?.bcv != null && (
        <p className="history-tooltip__row">
          <span className="history-tooltip__dot history-tooltip__dot--bcv" aria-hidden="true" />
          BCV: {formatRate(point.bcv)} Bs/{symbol}
        </p>
      )}
      {point?.paralelo != null && (
        <p className="history-tooltip__row">
          <span className="history-tooltip__dot history-tooltip__dot--paralelo" aria-hidden="true" />
          Paralelo: {formatRate(point.paralelo)} Bs/{symbol}
        </p>
      )}
    </div>
  )
}

export default function HistoryView() {
  const [currency, setCurrency] = useState('usd')
  const [seriesStatus, setSeriesStatus] = useState('loading')
  const [series, setSeries] = useState([])
  const [seriesError, setSeriesError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const [selectedDate, setSelectedDate] = useState('')
  const [dateStatus, setDateStatus] = useState('idle')
  const [dateResult, setDateResult] = useState({ bcv: null, paralelo: null })
  const dateRequestRef = useRef(0)

  const bcvColor = useCssVarColor('--color-primary')
  const paraleloColor = useCssVarColor('--color-text-soft')
  const gridColor = useCssVarColor('--color-border')
  const tickColor = useCssVarColor('--color-text-soft')

  const todayISO = getTodayISO()

  useEffect(() => {
    let cancelled = false
    setSeriesStatus('loading')

    fetchHistoricalSeries(currency)
      .then(data => {
        if (cancelled) return
        setSeries(data)
        setSeriesStatus('success')
      })
      .catch(err => {
        if (cancelled) return
        setSeriesError(
          err?.message === 'NETWORK'
            ? 'No hay internet. Revisa tu conexion e intentalo de nuevo.'
            : 'No pudimos cargar el historico. Intentalo de nuevo.'
        )
        setSeriesStatus('error')
      })

    return () => { cancelled = true }
  }, [currency, reloadToken])

  async function runDateQuery(targetCurrency, dateValue) {
    if (!dateValue) {
      setDateStatus('idle')
      return
    }

    const requestId = ++dateRequestRef.current
    setDateStatus('loading')

    try {
      const [bcv, paralelo] = await Promise.all([
        fetchRateByDate(targetCurrency, 'oficial', dateValue),
        fetchRateByDate(targetCurrency, 'paralelo', dateValue)
      ])

      if (requestId !== dateRequestRef.current) return

      if (bcv === null && paralelo === null) {
        setDateStatus('empty')
      } else {
        setDateResult({ bcv, paralelo })
        setDateStatus('success')
      }
    } catch {
      if (requestId !== dateRequestRef.current) return
      setDateStatus('error')
    }
  }

  function handleCurrencyChange(nextCurrency) {
    if (nextCurrency === currency) return
    setCurrency(nextCurrency)
    // Fix v0.14.1: antes se borraba selectedDate al cambiar de moneda.
    // Ahora se mantiene la fecha y se re-consulta en la moneda nueva.
    if (selectedDate) {
      runDateQuery(nextCurrency, selectedDate)
    }
  }

  function handleRetry() {
    setReloadToken(token => token + 1)
  }

  function handleDateInputChange(event) {
    const value = event.target.value
    setSelectedDate(value)
    runDateQuery(currency, value)
  }

  const recentDays = series.slice(-10).reverse()
  const symbol = currency === 'eur' ? '€' : '$'
  const gapText = formatGap(dateResult.bcv, dateResult.paralelo)

  return (
    <>
      <section className="history-chart-card" aria-label="Historico de tasas">
        <div className="history-chart-card__header">
          <p className="calc-card__label">Histórico (90 días)</p>
          <TargetCurrencySelector value={currency} onChange={handleCurrencyChange} label="" />
        </div>

        {seriesStatus === 'loading' && (
          <div className="history-status" role="status">Cargando histórico...</div>
        )}

        {seriesStatus === 'error' && (
          <div className="history-status" role="alert">
            <p>{seriesError}</p>
            <button type="button" className="copy-button" onClick={handleRetry}>
              <RefreshCw size={16} strokeWidth={1.5} aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        {seriesStatus === 'success' && (
          <>
            <div className="history-chart">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={formatShortDate}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                    tick={{ fontSize: 11, fill: tickColor }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tick={{ fontSize: 11, fill: tickColor }}
                    tickFormatter={value => formatRate(value)}
                  />
                  <Tooltip content={<HistoryTooltip currency={currency} />} />
                  <Line
                    type="monotone"
                    dataKey="bcv"
                    stroke={bcvColor}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="paralelo"
                    stroke={paraleloColor}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="history-legend">
              <span className="history-legend__item">
                <span className="history-legend__swatch history-legend__swatch--bcv" aria-hidden="true" />
                BCV
              </span>
              <span className="history-legend__item">
                <span className="history-legend__swatch history-legend__swatch--paralelo" aria-hidden="true" />
                Paralelo
              </span>
            </div>

            <div className="history-days-list">
              <div className="history-days-list__row history-days-list__row--header">
                <span>Fecha</span>
                <span>BCV</span>
                <span>Paralelo</span>
              </div>
              {recentDays.map(day => (
                <div key={day.fecha} className="history-days-list__row">
                  <span className="history-days-list__date">{formatShortDate(day.fecha)}</span>
                  <span className="history-days-list__value tabular-nums">
                    {day.bcv != null ? formatRate(day.bcv) : '—'}
                  </span>
                  <span className="history-days-list__value tabular-nums">
                    {day.paralelo != null ? formatRate(day.paralelo) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="history-date-card" aria-label="Consultar tasa por fecha">
        <label className="history-date__label" htmlFor="history-date-input">
          <Calendar size={16} strokeWidth={1.5} aria-hidden="true" /> Toca para elegir una fecha
        </label>
        <input
          id="history-date-input"
          type="date"
          className="history-date__input"
          value={selectedDate}
          max={todayISO}
          min={HISTORY_EARLIEST_DATE}
          onChange={handleDateInputChange}
        />

        {dateStatus === 'loading' && <p className="history-date__status">Consultando...</p>}
        {dateStatus === 'empty' && <p className="history-date__status">No hay datos para esa fecha.</p>}
        {dateStatus === 'error' && <p className="history-date__status">No pudimos consultar esa fecha.</p>}
        {dateStatus === 'success' && (
          <div className="history-result-card">
            <p className="history-result-card__date">{formatLongDate(selectedDate)}</p>
            <div className="history-result-card__columns">
              <div className="history-result-card__col">
                <span className="history-result-card__label">BCV</span>
                <strong className="history-result-card__value history-result-card__value--bcv tabular-nums">
                  {dateResult.bcv != null ? formatRate(dateResult.bcv) : '—'}
                </strong>
              </div>
              <div className="history-result-card__col">
                <span className="history-result-card__label">Paralelo</span>
                <strong className="history-result-card__value tabular-nums">
                  {dateResult.paralelo != null ? formatRate(dateResult.paralelo) : '—'}
                </strong>
              </div>
            </div>
            <p className="history-result-card__unit">Bs/{symbol}</p>
            {gapText && <p className="history-result-card__gap">Brecha: {gapText}</p>}
          </div>
        )}
      </section>
    </>
  )
}
