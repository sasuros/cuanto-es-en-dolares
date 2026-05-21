/**
 * Segmented control de modo: muestra AMBAS opciones (Bolívares / Dólares)
 * con el seleccionado resaltado en verde. Reemplaza el toggle "Cambiar a..."
 * de v0.2.1+ — para adultos mayores, ver el estado actual + ambas opciones
 * disponibles es más claro que un solo botón con etiqueta dinámica.
 *
 * Validado con usuario real en mockup v0.4.0.
 */
export default function ModeSelector({ mode, onChange, disabled = false }) {
  const isBsMode = mode === 'bs-to-usd'

  return (
    <div className="mode-selector">
      <p className="mode-selector__label">¿QUÉ TIENES?</p>
      <div className="mode-selector__group" role="radiogroup" aria-label="Selector de moneda de origen">
        <button
          type="button"
          role="radio"
          aria-checked={isBsMode}
          className={
            'mode-selector__option' +
            (isBsMode ? ' mode-selector__option--active' : '')
          }
          onClick={() => onChange('bs-to-usd')}
          disabled={disabled}
        >
          <span className="mode-selector__option-main">Bolívares</span>
          <span className="mode-selector__option-symbol">Bs</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!isBsMode}
          className={
            'mode-selector__option' +
            (!isBsMode ? ' mode-selector__option--active' : '')
          }
          onClick={() => onChange('usd-to-bs')}
          disabled={disabled}
        >
          <span className="mode-selector__option-main">Dólares</span>
          <span className="mode-selector__option-symbol">$</span>
        </button>
      </div>
    </div>
  )
}
