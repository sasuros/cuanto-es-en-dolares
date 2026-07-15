# 💵 ¿CUÁNTO ES EN DÓLARES? - DOCUMENTO MAESTRO

**Proyecto:** Calculadora de conversión Bs ↔ USD para adultos mayores  
**Cliente:** Sasuros / Scanleads  
**Inicio:** 17 mayo 2026  
**Objetivo:** Ayudar a personas mayores a entender cuánto están gastando realmente en una economía dolarizada

---

## 🎯 PROBLEMA A RESOLVER

**Situación actual:**
- Venezuela opera con precios en bolívares que cambian diariamente
- Personas mayores no saben cuánto están gastando en términos reales (dólares)
- Brecha entre tasa BCV oficial y tasa paralela de referencia
- Necesitan saber: "¿Estos 1.5 millones de bolívares son mucho o poco?"

**Usuario objetivo:**
- Adultos mayores (50+ años)
- No técnicos
- Usan WhatsApp pero tecnología básica
- Necesitan interfaz ULTRA simple
- Texto grande, pasos claros

---

## 📱 TIPO DE APLICACIÓN

**Decisión:** Web App Progresiva (PWA)

**Ventajas para el usuario final:**
1. No necesita instalar desde tienda de apps
2. Se guarda como acceso directo en pantalla de inicio
3. Funciona en cualquier teléfono (iOS/Android)
4. Actualizaciones automáticas
5. Puede funcionar sin internet (última tasa guardada)

**Stack tecnológico actual:**
- Frontend: React (interfaz simple)
- Hosting: Netlify (gratis, rápido)
- API: ve.dolarapi.com (BCV oficial + paralelo, sin API key)
- OCR (Fase 3): Tesseract.js

---

## 🗺️ ROADMAP DE DESARROLLO

### **FASE 1: MVP ULTRA SIMPLE** ⭐ ✅ **COMPLETADA + ITERADA**

**Objetivo:** App funcional en 24-48 horas → **Logrado en ~9 horas totales**

**Funcionalidades entregadas (v0.1.0 → v0.6.0):**
- ✅ Input manual de monto con formato venezolano (1.500.000)
- ✅ Auto-cálculo con debounce, sin botón extra
- ✅ Resultado en USD GIGANTE (56px / 72px en desktop)
- ✅ Conversión bidireccional Bs↔USD con selector de modo
- ✅ Modo "Otra tasa" para tasa personalizada
- ✅ Quick chips de montos comunes
- ✅ Indicador de vigencia: ✅ HOY / ⚠️ desde mañana (v0.2.2)
- ✅ Tasa visible al abrir, sin calcular (v0.3.0)
- ✅ Tasa paralela como referencia + brecha porcentual (v0.6.0)
- ✅ Resultado alternativo "Con paralelo" después de calcular (v0.6.0)
- ✅ Modo oscuro WCAG AAA
- ✅ PWA instalable, offline-first
- ✅ Responsive (móvil primero)

**Criterios de éxito — TODOS cumplidos:**
- ✅ Mamá de Sasuros puede usarla sin ayuda
- ✅ Carga en menos de 2 segundos (bundle: 50 KB gzipped)
- ✅ Funciona en cualquier teléfono (testeada en iOS + escritorio)

**API actual:**
- ve.dolarapi.com (gratis, sin API key, sin límites declarados)
- Endpoint principal: `https://ve.dolarapi.com/v1/dolares`
- Fallback: `https://ve.dolarapi.com/v1/dolares/oficial`
- Caché local: `bcv-rate-cache-v2` por 30 minutos ✅

**Arquitectura final en producción:**
```
/src
  /components
    CalculatorInput.jsx     # Input bidireccional + toggle "Cambiar a..."
    ModeSelector.jsx        # Selector Bs / USD / Otra tasa
    ResultDisplay.jsx       # Resultado del cálculo (3 estados)
    InitialRateCard.jsx     # Tasa BCV + paralelo visible al abrir
  /services
    apiService.js           # fetch BCV/paralelo + caché + manejo de errores
  /utils
    formatters.js           # Bs, USD, tasa, vigencia, tiempo relativo
  App.jsx, main.jsx, styles.css
netlify.toml                # SPA fallback + headers
```

**URL en producción:** https://cuantoeseldolares.netlify.app

---

### **FASE 2: COMPARACIÓN BCV vs PARALELO** ✅ **COMPLETADA (v0.6.0)**

**Funcionalidades entregadas:**
- ✅ Mostrar DOS tasas: BCV oficial + paralelo.
- ✅ Brecha porcentual BCV vs paralelo.
- ✅ Color verde si paralelo es menor que BCV.
- ✅ Color naranja si paralelo es mayor que BCV.
- ✅ Resultado alternativo "Con paralelo" después de calcular.
- ✅ Degradación elegante si paralelo no está disponible.
- ✅ Sin selector nuevo: BCV sigue siendo la tasa principal; "Otra tasa" cubre uso manual.

**API usada:**
- `https://ve.dolarapi.com/v1/dolares`
- Devuelve oficial + paralelo en una sola llamada.

**Diseño propuesto:**
```
INGRESASTE: 1.500.000 Bs
━━━━━━━━━━━━━━━━━━━━━━━━
BCV oficial:
   723,99 Bs/$

Paralelo:
   822,36 Bs/$
   
Brecha: ↑ 13.6% más que BCV
━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **FASE 3: FOTO DE FACTURA (OCR)** (Después de validar Fase 2)

**Objetivo:** Simplificar entrada de datos

**Funcionalidad:**
- Botón "📸 TOMAR FOTO DE FACTURA"
- Usa cámara del teléfono
- OCR detecta el monto total automáticamente
- Usuario confirma y calcula

**Tecnología:**
- Tesseract.js (OCR en el navegador)
- Preprocesamiento de imagen (contraste, rotación)
- Detección de números con regex

**Flujo de usuario:**
1. Click en "Tomar foto"
2. Toma foto de ticket/factura
3. App detecta: "1.500.000 Bs"
4. Pregunta: "¿Es correcto este monto?"
5. Usuario confirma → Cálculo automático

**Desafíos técnicos:**
- Precisión del OCR en facturas con mala calidad
- Diferentes formatos de números (1.500.000 vs 1500000)
- Luz, ángulo de foto

---

### **FASE 4: UTILIDADES** (Mejoras progresivas)

**Funcionalidades extras:**
- 📊 Historial de conversiones (últimas 10)
- ✅ Conversión inversa (USD → Bs)
- 📤 Compartir cálculo por WhatsApp
- 🌙 Modo oscuro
- ⏰ Indicador de última actualización de tasas
- 💾 Guardar cálculos favoritos

---

### **FASE 5: AVANZADO** (Futuro)

**Features premium:**
- 🔔 Alertas cuando brecha BCV/Binance supere X%
- 🌍 Múltiples monedas (EUR, COP, ARS, etc.)
- 📈 Gráfico de tendencia de tasas (7 días, 30 días)
- 💳 Calculadora de presupuesto mensual
- 📁 Exportar historial a PDF/Excel

---

## 🎨 PRINCIPIOS DE DISEÑO

### **Reglas de oro para usuarios mayores:**

1. **TEXTO GRANDE**
   - Mínimo 18px en mobile
   - Títulos de 24-32px
   - Alto contraste (negro sobre blanco)

2. **BOTONES GIGANTES**
   - Mínimo 60px de altura
   - Espaciado generoso (no botones pegados)
   - Colores claros que indiquen acción

3. **PASOS SIMPLES**
   - Máximo 2 pasos para cualquier acción
   - Un objetivo por pantalla
   - Confirmaciones visuales claras

4. **LENGUAJE COTIDIANO**
   - "Tomar foto" NO "Capturar imagen"
   - "Calcular" NO "Procesar"
   - "Cuánto es en dólares" NO "Conversión de divisa"

5. **FEEDBACK INMEDIATO**
   - Loading con mensaje: "Buscando tasa actual..."
   - Éxito con mensaje: "✓ Listo!"
   - Error con solución: "No hay internet. Usando última tasa guardada."

---

## 🔧 STACK TÉCNICO

### **Frontend**
- **Framework:** React 18
- **Estilo:** CSS puro (sin frameworks complejos)
- **Build:** Vite (rápido, simple)
- **PWA:** Workbox (offline support)

### **APIs de tasas**
- **BCV + Paralelo:** https://ve.dolarapi.com/v1/dolares
  - Gratis
  - Sin API key
  - Llamada directa desde frontend

- **Fallback BCV:** https://ve.dolarapi.com/v1/dolares/oficial
  - Se usa si el endpoint combinado falla

### **OCR (Fase 3)**
- **Motor:** Tesseract.js
- **Preprocesamiento:** Canvas API
- **Idioma:** español (spa)

### **Hosting**
- **Plataforma:** Netlify
- **Dominio:** cuantoesendolares.com (sugerido)
- **SSL:** Incluido gratis
- **CDN:** Global

### **Analytics (Opcional)**
- Google Analytics básico
- Métricas: uso diario, conversiones, errores

---

## 📊 MÉTRICAS DE ÉXITO

### **Fase 1 (MVP):**
- ✅ 3 personas mayores pueden usarla sin ayuda
- ✅ Tiempo de carga < 2 segundos
- ✅ 0 errores en cálculo de conversión
- ✅ Funciona en 3 tipos de teléfono diferentes

### **Fase 2:**
- ✅ Usuario ve la diferencia BCV vs paralelo sin cambiar el flujo principal
- ✅ Una llamada obtiene ambas tasas
- ✅ Muestra % de diferencia correctamente

### **Fase 3:**
- ✅ OCR detecta monto correcto en 8 de 10 facturas
- ✅ Usuario puede corregir monto detectado
- ✅ Foto se procesa en < 5 segundos

---

## 🚀 PLAN DE LANZAMIENTO

### **Pre-lanzamiento:**
1. Desarrollar Fase 1 (MVP)
2. Testear con 5 personas mayores
3. Ajustar según feedback
4. Preparar guía de uso visual (infografía)

### **Lanzamiento suave:**
1. Compartir en familia/amigos cercanos
2. Recoger feedback primeras 2 semanas
3. Iterar mejoras críticas

### **Lanzamiento público:**
1. Crear video tutorial corto (TikTok/Instagram)
2. Post en grupos de venezolanos en redes sociales
3. Considerar integración con DJ Request como upsell

---

## 📁 ESTRUCTURA DE ARCHIVOS (v0.6.0)

```
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
│   │   ├── CalculatorInput.jsx    # Input, chips, modo custom
│   │   ├── InitialRateCard.jsx    # BCV + paralelo al abrir
│   │   ├── ModeSelector.jsx       # Bs / USD / Otra tasa
│   │   └── ResultDisplay.jsx      # Resultado BCV + referencia paralela
│   ├── services/
│   │   └── apiService.js          # DolarAPI + caché + fallback
│   ├── utils/
│   │   └── formatters.js          # Bs, USD, tasa, fechas y vigencia
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── netlify.toml                   # SPA fallback + headers
├── vite.config.js
├── package.json
└── README.md
```

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

1. **API Keys:**
   - La versión actual no requiere API keys.
   - No hay variables privadas en `.env`.
   - El bundle se verifica para evitar secretos accidentales.

2. **Límites de uso:**
   - Caché de tasas por 30 minutos.
   - Una sola llamada obtiene BCV + paralelo.
   - Guardar última tasa en localStorage

3. **Privacidad:**
   - No guardar fotos de facturas
   - No rastrear información personal
   - Cumplir con transparencia de datos

---

## 📝 BITÁCORA DE DESARROLLO

> Ver detalle completo en [`BITACORA-CUANTO-ES-EN-DOLARES.md`](./BITACORA-CUANTO-ES-EN-DOLARES.md).

### **17 Mayo 2026** — Día 1
- ✅ Investigación de APIs (BCV, paralelo/Binance)
- ✅ Análisis de tecnologías OCR
- ✅ Definición de roadmap
- ✅ Creación de documento maestro

### **18 Mayo 2026** — Día 2 — MVP completo + Deploy
- ✅ Estructura React 18 + Vite 6 + PWA
- ✅ Modo oscuro WCAG AAA
- ✅ CalculatorInput, ResultDisplay, integración API BCV
- ✅ Netlify Function que oculta API key server-side
- ✅ CDN cache 12h (descarta Blobs+cron por sobre-ingeniería)
- ✅ Deploy a https://cuantoeseldolares.netlify.app
- 🏷️ **v0.1.0** — MVP minimal en producción

### **19-20 Mayo 2026** — Día 3 — Iteraciones con feedback real
- 🎉 Mamá probó v0.1.0 → pidió conversión inversa USD→Bs
- 🏷️ **v0.2.0** — Conversión bidireccional Bs↔USD
- 🏷️ **v0.2.1** — Toggle más visible (icono + texto "Cambiar a...")
- 🐛 Bug confirmado: BCV publica tasa del día siguiente desde 3-4 PM VET
- 🏷️ **v0.2.2** — Indicador de vigencia (✅ HOY / ⚠️ desde mañana)
- 🏷️ **v0.3.0** — InitialRateCard: tasa visible al abrir la app

### **14 Julio 2026** — Sprint 1 — Reactivación
- 🛑 bcvapi.tech agotó cuota gratuita y dejó a la app con tasa vieja
- ✅ Migración a ve.dolarapi.com
- ✅ Eliminación de Netlify Function y proxy de Vite
- ✅ Caché v2 de 30 minutos
- ✅ Build verificado sin API keys
- 🏷️ **v0.5.0** — DolarAPI gratuita en producción

### **14 Julio 2026** — Sprint 2 — Tasa paralela
- ✅ Endpoint combinado `/v1/dolares` para BCV + paralelo
- ✅ Brecha BCV vs paralelo
- ✅ Resultado alternativo "Con paralelo"
- ✅ Documentación actualizada
- 🏷️ **v0.6.0** — Fase 2 completada

### **Estado actual**
- ✅ App activa en producción con BCV + paralelo
- ✅ Fase 2 completada
- 📦 Bundle liviano, carga sub-2s en 4G
- 🔎 Siguiente foco: validar uso diario antes de agregar features grandes

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

> **Modo VALIDACIÓN, no expansión.** La app ya cubre BCV, paralelo y tasa custom.
> Antes de agregar OCR o historial, conviene observar uso real.

1. **Validación con usuario real:**
   - Mamá usa v0.6.0 varios días en su rutina normal
   - Observar QUÉ no entiende, QUÉ duda, QUÉ confunde
   - Anotar todo, sin filtrar

2. **Ampliar testers (suave):**
   - Compartir URL con 3-5 familiares más por WhatsApp
   - Idealmente otros adultos mayores
   - Recoger patrones, no anécdotas aisladas

3. **Capturar screenshots reales:**
   - De la app live (no del preview de dev)
   - Subir a `docs/screenshots/` y enlazar desde el README

4. **Decisión post-feedback:**
   - Si piden repetir cálculos → historial local
   - Si tipear sigue siendo fricción → OCR de facturas
   - Si hay confusión con paralelo → ajustar copy antes de agregar más features

---

## 💡 NOTAS IMPORTANTES

- **Prioridad absoluta:** Simplicidad sobre features
- **Si hay duda de UX:** Preguntarle a una persona mayor
- **Cada feature:** Debe tener propósito claro
- **Mantra del proyecto:** "¿Mi mamá lo entendería?"

---

## 📞 RECURSOS Y CONTACTOS

**APIs:**
- DolarAPI Venezuela: https://ve.dolarapi.com

**Comunidad:**
- GitHub Issues (para bugs)
- Grupo de testers (WhatsApp)

**Referencias técnicas:**
- Tesseract.js docs: https://tesseract.projectnaptha.com/
- React PWA guide: https://create-react-app.dev/docs/making-a-progressive-web-app/

---

**Última actualización:** 14 julio 2026
**Versión del documento:** 3.0 (post Fase 2 en producción)
**Versión de la app en producción:** v0.6.0
**Mantenido por:** Sasuros / Scanleads
