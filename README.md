# ¿Cuánto es en Dólares?

Calculadora web simple para convertir bolívares ↔ dólares usando la tasa oficial del BCV, con la tasa paralela como referencia visual. Está pensada para adultos mayores venezolanos: texto grande, flujo corto, sin login y sin tecnicismos.

[![Status](https://img.shields.io/badge/status-v0.6.0-green)](#)
[![Stack](https://img.shields.io/badge/stack-React%2018%20%2B%20Vite%206-blue)](#)
[![PWA](https://img.shields.io/badge/PWA-ready-green)](#)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

## Demo

Producción: https://cuantoeseldolares.netlify.app

## Qué hace

- Convierte bolívares a dólares con la tasa BCV oficial.
- Convierte dólares a bolívares con la tasa BCV oficial.
- Calcula automáticamente mientras escribes.
- Acepta montos grandes y decimales en formato venezolano: `12.058,55`.
- Incluye chips rápidos para montos comunes.
- Muestra la tasa BCV al abrir la app.
- Muestra tasa paralela y brecha contra BCV como referencia.
- En cada cálculo muestra el resultado principal con BCV y una comparación "Con paralelo".
- Incluye modo "Otra tasa" para calcular con una tasa manual.
- Protege contra usar tasas futuras publicadas antes de que estén vigentes.
- Funciona como PWA instalable.

La app siempre calcula con BCV en los modos principales. La tasa paralela es solo informativa. Si alguien quiere usar otra tasa para calcular, usa el modo "Otra tasa".

## API

La app usa [ve.dolarapi.com](https://ve.dolarapi.com), sin API key y sin proxy:

- Principal: `GET https://ve.dolarapi.com/v1/dolares`
- Fallback: `GET https://ve.dolarapi.com/v1/dolares/oficial`
- Fallback legado: `https://bcvapi.tech/api/v1/dolar`

El caché local usa `bcv-rate-cache-v2` con duración de 30 minutos. No hay variables privadas ni API keys en el bundle.

## Correr localmente

Requisitos:

- Node 20+
- npm

```bash
git clone https://github.com/sasuros/cuanto-es-en-dolares.git
cd cuanto-es-en-dolares
npm install
npm run dev
```

Abre http://localhost:5173

No hace falta `.env.local`.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 6 |
| Estilos | CSS puro |
| PWA | vite-plugin-pwa + Workbox |
| API tasas | ve.dolarapi.com |
| Hosting | Netlify |

## Estructura

```text
cuanto-es-en-dolares/
├── docs/
│   ├── BITACORA-CUANTO-ES-EN-DOLARES.md
│   ├── CUANTO-ES-EN-DOLARES-MAESTRO.md
│   └── README.md
├── public/
│   ├── favicon.svg
│   └── icon.svg
├── src/
│   ├── components/
│   │   ├── CalculatorInput.jsx
│   │   ├── InitialRateCard.jsx
│   │   ├── ModeSelector.jsx
│   │   └── ResultDisplay.jsx
│   ├── services/
│   │   └── apiService.js
│   ├── utils/
│   │   └── formatters.js
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── netlify.toml
├── vite.config.js
└── package.json
```

## Roadmap real

- [x] v0.1.0: MVP Bs → USD con tasa BCV.
- [x] v0.2.0: Conversión bidireccional Bs ↔ USD.
- [x] v0.3.0: Tasa visible al abrir.
- [x] v0.4.0: Rediseño para uso diario, chips rápidos y mejor UX.
- [x] v0.4.1: Protección contra tasa futura.
- [x] v0.4.2: Modo "Otra tasa" y decimales en bolívares.
- [x] v0.5.0: Migración a DolarAPI gratuita y eliminación de Netlify Function.
- [x] v0.6.0: Tasa paralela, brecha BCV vs paralelo y docs actualizados.
- [ ] v0.7.0: Historial local de conversiones.
- [ ] Futuro: OCR de facturas, tendencias, alertas y utilidades.

## Principios de diseño

- Texto grande y alto contraste.
- Acciones visibles y pocas decisiones.
- Lenguaje cotidiano.
- Resultado principal claro; referencias secundarias discretas.
- Sin login, sin configuración, sin claves.

## Licencia

[MIT](LICENSE)
