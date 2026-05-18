# 💵 ¿Cuánto es en Dólares?

> Web App ultra-simple que convierte **bolívares a dólares** en tiempo real,
> usando la tasa oficial del BCV. Diseñada para **adultos mayores venezolanos**.

[![Status](https://img.shields.io/badge/status-MVP-yellow)](#)
[![Stack](https://img.shields.io/badge/stack-React%2018%20%2B%20Vite%206-blue)](#)
[![PWA](https://img.shields.io/badge/PWA-ready-green)](#)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

---

## 🎯 El problema

> _"Hijo, me dijeron 1.500.000 bolívares. ¿Eso es mucho o poco?"_

En Venezuela los precios están en bolívares que cambian cada día. Las personas
mayores **no saben cuánto están gastando realmente** en términos de dólares.
Esta app responde esa pregunta con un solo botón.

## ✨ La solución

1. Escribes el monto en bolívares: `1.500.000`
2. Tocas **CALCULAR**
3. Ves el resultado: **$2,895.97**

Eso es todo. Sin login, sin opciones, sin tecnicismos.

## 📱 Demo en vivo

🚧 _Próximamente en Netlify_ — instalable como PWA en cualquier teléfono.

## 📸 Capturas

> Coloca capturas en `docs/screenshots/` y enlázalas desde aquí.

```
docs/screenshots/
├── main.png          ← Pantalla principal
├── result.png        ← Resultado de conversión
└── error.png         ← Estado sin internet
```

---

## 🚀 Para correrlo localmente

### Requisitos
- Node 20+ y npm

### Pasos
```bash
git clone <tu-url-del-repo>
cd cuanto-es-en-dolares
npm install
cp .env.example .env.local
# Edita .env.local y agrega tu API key de bcvapi.tech
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

### Obtener API Key
1. Registrarse gratis en [bcvapi.tech](https://www.bcvapi.tech/)
2. Copiar el key del dashboard
3. Pegar en `.env.local`:
   ```
   VITE_BCV_API_KEY=tu_api_key_aqui
   VITE_BCV_API_URL=/api/bcv
   ```

---

## 🏗️ Stack técnico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | **React 18** + **Vite 6** | Build rápido, HMR instantáneo |
| Estilos | **CSS puro** | Sin Tailwind ni frameworks — control total |
| PWA | **vite-plugin-pwa** + Workbox | Offline-first, caché inteligente |
| Hosting | **Netlify** | Gratis, proxy para CORS, deploy automático |
| API tasa | [bcvapi.tech](https://www.bcvapi.tech/) | Plan gratuito 50 consultas/mes |

## 🎨 Principios de diseño

Esta app es **diferente** a cualquier app que hayas visto. Está hecha para
quienes no usan apps complicadas. Reglas estrictas:

- ✅ Texto **gigante** (18px base, 56–72px resultado)
- ✅ Botones de mínimo **60px** de altura
- ✅ Modo oscuro con contraste **WCAG AAA**
- ✅ Lenguaje cotidiano (sin "procesar", sin "API")
- ✅ Máximo **2 pasos** para cualquier acción
- ✅ Feedback claro: loading, éxito, error en español sencillo

## 🧠 Decisiones inteligentes

- **Caché de 10 minutos**: la cuota de 50 consultas/mes alcanza para uso normal
- **Fallback a caché viejo**: si no hay internet, muestra la última tasa conocida
- **Proxy CORS**: la API key vive solo en el server (Vite dev + Netlify prod)
- **Sin login**: una app así no debe pedir cuenta para usarse
- **PWA instalable**: se guarda en pantalla de inicio como una app nativa

---

## 📁 Estructura

```
cuanto-es-en-dolares/
├── docs/                          # Documentación del proyecto
│   ├── CUANTO-ES-EN-DOLARES-MAESTRO.md
│   ├── BITACORA-CUANTO-ES-EN-DOLARES.md
│   └── README.md                  # README extendido (técnico)
├── public/
│   ├── favicon.svg                # Ícono PWA
│   └── icon.svg
├── src/
│   ├── components/
│   │   ├── CalculatorInput.jsx    # Input + botón CALCULAR
│   │   └── ResultDisplay.jsx      # 3 estados: success / loading / error
│   ├── services/
│   │   └── apiService.js          # fetch BCV + caché + manejo de errores
│   ├── utils/
│   │   └── formatters.js          # Bs, USD, tiempo relativo
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css                 # Variables, modo oscuro, componentes
├── netlify.toml                   # Proxy CORS + SPA fallback + headers
├── vite.config.js                 # Vite + PWA + proxy dev
└── package.json
```

---

## 🗺️ Roadmap

- [x] **Fase 1: MVP Ultra Simple** — Conversión Bs → USD con tasa BCV
- [ ] **Fase 2: BCV vs Binance** — Mostrar ambas tasas
- [ ] **Fase 3: Foto de factura (OCR)** — Tesseract.js para evitar tipear
- [ ] **Fase 4: Utilidades** — Historial, conversión inversa, compartir
- [ ] **Fase 5: Avanzado** — Múltiples monedas, gráficos, alertas

Ver [docs/CUANTO-ES-EN-DOLARES-MAESTRO.md](docs/CUANTO-ES-EN-DOLARES-MAESTRO.md)
para el roadmap detallado y la visión completa.

---

## 🤝 Contribuir

Por ahora es un proyecto personal. Si tienes una mamá venezolana que la usa y
encuentra un problema, abre un issue. Las reglas:

- Mantén la simplicidad
- Piensa en adultos mayores
- Si dudas, pregúntale a una persona mayor

## 📄 Licencia

[MIT](LICENSE) — úsalo libremente. Si ayuda a alguien, eso es lo que importa.

---

**Hecho con ❤️ para las mamás venezolanas que merecen entender su economía.**
