export default function TargetCurrencySelector({ value, onChange, disabled, label = 'Convertir a:' }) {
  return (
    <div className="target-currency-selector">
      {label && <span className="target-currency-selector__label">{label}</span>}
      <div className="target-currency-selector__group" role="radiogroup" aria-label="Moneda destino">
        <button
          type="button"
          role="radio"
          aria-checked={value === 'usd'}
          className={`target-currency-selector__option${value === 'usd' ? ' target-currency-selector__option--active' : ''}`}
          onClick={() => onChange('usd')}
          disabled={disabled}
        >
          $ Dólar
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === 'eur'}
          className={`target-currency-selector__option${value === 'eur' ? ' target-currency-selector__option--active' : ''}`}
          onClick={() => onChange('eur')}
          disabled={disabled}
        >
          € Euro
        </button>
      </div>
    </div>
  )
}
