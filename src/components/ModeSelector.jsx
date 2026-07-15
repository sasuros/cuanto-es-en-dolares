export default function ModeSelector({ mode, onChange, disabled = false }) {
  const options = [
    { id: 'bs-to-usd', label: 'Bolívares', symbol: 'Bs' },
    { id: 'usd-to-bs', label: 'Dólares', symbol: '$' },
    { id: 'eur-to-bs', label: 'Euros', symbol: '€' },
    { id: 'custom', label: 'Otra tasa', symbol: 'Custom' }
  ]

  return (
    <div className="mode-selector">
      <p className="mode-selector__label">¿QUÉ TIENES?</p>
      <div
        className="mode-selector__group"
        role="radiogroup"
        aria-label="Selector de modo de conversión"
      >
        {options.map(opt => {
          const isActive = mode === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={
                'mode-selector__option' +
                (isActive ? ' mode-selector__option--active' : '')
              }
              onClick={() => onChange(opt.id)}
              disabled={disabled}
            >
              <span className="mode-selector__option-main">{opt.label}</span>
              <span className="mode-selector__option-symbol">{opt.symbol}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
