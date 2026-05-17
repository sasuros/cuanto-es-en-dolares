# 💵 ¿Cuánto es en Dólares?

> Calculadora simple de conversión Bs → USD/USDT para adultos mayores venezolanos

![Status](https://img.shields.io/badge/status-en%20desarrollo-yellow)
![Fase](https://img.shields.io/badge/fase-MVP-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 ¿Qué es esto?

Una web app ultra-simple que ayuda a personas mayores a entender cuánto están gastando en dólares cuando los precios están en bolívares que cambian todos los días.

**Problema real:**
- "Mamá, ¿sabes cuántos dólares gastaste hoy?"
- "No sé hijo, me dijeron 1.500.000 bolívares..."

**Solución:**
- Input: 1.500.000
- Output: "Son $2,897 dólares (según BCV)" o "$2,163 (según Binance)"
- Listo. Simple. Claro.

---

## 🚀 Estado actual del proyecto

**Versión:** 0.1.0 (Pre-alpha)  
**Fase actual:** Fase 1 - MVP Ultra Simple  
**Última actualización:** 17 mayo 2026

### ✅ Completado
- [x] Investigación de APIs
- [x] Definición de roadmap
- [x] Documentación base
- [x] Decisiones de arquitectura

### 🔄 En progreso
- [ ] Configuración proyecto React
- [ ] Componentes básicos
- [ ] Integración API BCV
- [ ] Primera prueba con usuarios

### 📅 Próximamente
- Fase 2: Comparación BCV vs Binance
- Fase 3: OCR para fotos de facturas
- Fase 4: Historial y compartir
- Fase 5: Features avanzados

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** React 18
- **Build:** Vite
- **Estilos:** CSS puro (sin frameworks)
- **PWA:** Workbox (para funcionar offline)

### APIs
- **Tasa BCV:** [bcvapi.tech](https://www.bcvapi.tech/)
- **Tasa Binance:** Por definir (usdt.com.ve o exchangemonitor.net)

### OCR (Fase 3)
- **Motor:** Tesseract.js
- **Idioma:** Español (spa)

### Hosting
- **Plataforma:** Netlify
- **Dominio:** Por definir
- **SSL:** Incluido

---

## 📦 Instalación (Para desarrolladores)

```bash
# Clonar repositorio (cuando exista)
git clone https://github.com/scanleads/cuanto-es-en-dolares.git
cd cuanto-es-en-dolares

# Instalar dependencias
npm install

# Crear archivo .env.local con tu API Key
echo "VITE_BCV_API_KEY=tu_api_key_aqui" > .env.local

# Iniciar servidor de desarrollo
npm run dev
```

Abrir en navegador: `http://localhost:5173`

---

## 🔑 Configuración de APIs

### 1. Obtener API Key de BCV

1. Registrarse en [bcvapi.tech](https://www.bcvapi.tech/)
2. Ir a tu dashboard
3. Copiar tu API Key
4. Agregar a `.env.local`:
   ```
   VITE_BCV_API_KEY=tu_api_key_aqui
   ```

### 2. Testear API

```bash
# Con curl
curl -X GET "https://bcvapi.tech/api/v1/dolar" \
  -H "Authorization: tu_api_key_aqui"

# Respuesta esperada:
# {"tasa": 517.96, "fecha": "2026-05-16"}
```

---

## 📁 Estructura del Proyecto

```
cuanto-es-en-dolares/
├── public/
│   ├── manifest.json          # PWA configuration
│   ├── icon-192.png           # App icon (small)
│   └── icon-512.png           # App icon (large)
│
├── src/
│   ├── components/
│   │   ├── CalculatorInput.jsx    # Input de bolivares
│   │   ├── ResultDisplay.jsx      # Muestra resultado
│   │   └── LoadingSpinner.jsx     # Indicador de carga
│   │
│   ├── services/
│   │   └── apiService.js          # Llamadas a APIs
│   │
│   ├── utils/
│   │   └── formatters.js          # Formateo de números
│   │
│   ├── App.jsx                    # Componente principal
│   ├── main.jsx                   # Entry point
│   └── styles.css                 # Estilos globales
│
├── docs/
│   ├── CUANTO-ES-EN-DOLARES-MAESTRO.md    # Documento maestro
│   ├── BITACORA-CUANTO-ES-EN-DOLARES.md   # Bitácora de desarrollo
│   └── ROADMAP.md                          # Roadmap detallado
│
├── .env.local                 # Variables de entorno (git ignored)
├── .gitignore
├── package.json
├── vite.config.js
└── README.md                  # Este archivo
```

---

## 🎨 Guía de Estilo

### Principios de diseño

1. **TEXTO GIGANTE**
   - Usuarios son adultos mayores
   - Mínimo 18px en textos, 48px en resultados
   - Alto contraste siempre

2. **BOTONES ENORMES**
   - Mínimo 60px de altura
   - Fáciles de tocar en pantalla
   - Colores claros

3. **LENGUAJE SIMPLE**
   - "Tomar foto" NO "Capturar imagen"
   - "Calcular" NO "Procesar conversión"
   - Evitar tecnicismos

4. **FEEDBACK CLARO**
   - Loading: "Buscando tasa actual..."
   - Éxito: "✓ Listo!"
   - Error: "Sin internet. Usando última tasa."

### Paleta de colores

```css
/* Colores principales */
--color-primary: #2ECC71;      /* Verde - Acción principal */
--color-secondary: #3498DB;    /* Azul - BCV */
--color-accent: #F39C12;       /* Naranja - Binance */
--color-text: #2C3E50;         /* Gris oscuro - Texto */
--color-background: #FFFFFF;   /* Blanco - Fondo */
--color-error: #E74C3C;        /* Rojo - Errores */
```

---

## 🧪 Testing

### Test con usuarios reales

**Perfil de testers:**
- Adultos mayores (50+ años)
- Usuarios no técnicos
- Familiarizados con WhatsApp pero no con apps complejas

**Criterios de éxito:**
- ✅ Puede hacer una conversión sin ayuda
- ✅ Entiende el resultado
- ✅ Puede repetirlo al día siguiente
- ✅ No se confunde con botones/textos

### Test técnico

```bash
# Tests unitarios (cuando se implementen)
npm run test

# Tests E2E (cuando se implementen)
npm run test:e2e

# Build de producción
npm run build

# Preview de build
npm run preview
```

---

## 📱 PWA - Progressive Web App

Esta app funciona como una PWA, lo que significa:

- ✅ Se puede "instalar" como app en el teléfono
- ✅ Funciona sin internet (última tasa guardada)
- ✅ Recibe actualizaciones automáticamente
- ✅ Rápida como una app nativa

**Cómo instalarla en móvil:**

**iOS (Safari):**
1. Abrir en Safari
2. Tocar botón "Compartir"
3. "Agregar a pantalla de inicio"
4. Listo!

**Android (Chrome):**
1. Abrir en Chrome
2. Menú (3 puntos)
3. "Instalar app"
4. Listo!

---

## 🐛 Reporte de Bugs

Si encuentras un bug o tienes una sugerencia:

1. Revisa que no esté ya reportado
2. Crea un issue describiendo:
   - Qué esperabas que pasara
   - Qué pasó realmente
   - Pasos para reproducirlo
   - Capturas de pantalla si es posible

---

## 🤝 Contribuciones

Por ahora este es un proyecto personal de Scanleads, pero si quieres colaborar:

1. Fork el proyecto
2. Crea una branch (`git checkout -b feature/mejora`)
3. Commit tus cambios (`git commit -m 'Agrego mejora X'`)
4. Push a la branch (`git push origin feature/mejora`)
5. Abre un Pull Request

**Reglas de oro:**
- Mantén la simplicidad
- Piensa en adultos mayores
- Testa con usuarios reales antes de PR
- Documenta tus cambios

---

## 📄 Licencia

MIT License - Ver archivo [LICENSE](LICENSE) para más detalles.

Básicamente: úsalo libremente, modifícalo, compártelo. Si ayuda a alguien, eso es lo que importa.

---

## 🙏 Créditos

**Desarrollado por:** [Scanleads](https://scanleads.com)  
**Idea original:** Sasuros  
**Inspirado en:** Mamás venezolanas que solo quieren saber cuánto están gastando

**APIs utilizadas:**
- [bcvapi.tech](https://www.bcvapi.tech/) - Tasa BCV oficial
- [exchangemonitor.net](https://exchangemonitor.net/) - Tasa Binance (por confirmar)

**Tecnologías:**
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tesseract.js](https://tesseract.projectnaptha.com/) (Fase 3)
- [Workbox](https://developers.google.com/web/tools/workbox)

---

## 📞 Contacto

**Proyecto:** ¿Cuánto es en Dólares?  
**Empresa:** Scanleads  
**Email:** contacto@scanleads.com _(por confirmar)_  
**WhatsApp:** [Agregar cuando se lance]

---

## 🗺️ Roadmap

Ver [ROADMAP.md](docs/ROADMAP.md) para el plan completo de desarrollo.

**Resumen:**
- ✅ **Fase 1:** MVP Ultra Simple (Input manual)
- 🔄 **Fase 2:** Comparación BCV vs Binance
- 📅 **Fase 3:** OCR para fotos de facturas
- 📅 **Fase 4:** Historial y compartir
- 📅 **Fase 5:** Features avanzados

---

## 💡 FAQ

### ¿Por qué no una app de tienda (Play Store/App Store)?

Porque es una barrera extra para adultos mayores. Con la PWA:
- No necesitan "instalar" desde tienda
- Tú les envías un link por WhatsApp
- Ellos guardan acceso directo
- Listo

### ¿Funciona sin internet?

Sí, con limitaciones:
- Última tasa consultada queda guardada
- Se muestra timestamp de última actualización
- Requiere internet para actualizar tasas

### ¿Cuánto cuesta usar la app?

Es completamente gratis para usuarios finales.
Las APIs tienen límites gratuitos suficientes para uso normal.

### ¿Mis datos están seguros?

No guardamos NINGÚN dato personal:
- No pides login
- No rastreamos ubicación
- No guardamos fotos de facturas
- Solo consultamos tasas públicas

### ¿Qué tan preciso es?

- Tasa BCV: 100% precisa (viene del banco central)
- Tasa Binance: Refleja mercado P2P real
- OCR (Fase 3): ~80-90% precisión (usuario siempre puede corregir)

---

**⚠️ Disclaimer:**

Esta app es una herramienta de referencia. Las tasas de cambio fluctúan constantemente. Siempre verifica las tasas antes de transacciones importantes. No somos responsables por decisiones financieras tomadas basándose en la información provista.

---

**¿Preguntas? ¿Sugerencias?**

Abre un issue o contacta por WhatsApp (cuando se lance).

---

Hecho con ❤️ para las mamás venezolanas que merecen entender su economía.
