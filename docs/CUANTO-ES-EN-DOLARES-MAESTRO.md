# 💵 ¿CUÁNTO ES EN DÓLARES? - DOCUMENTO MAESTRO

**Proyecto:** Calculadora de conversión Bs → USD/USDT para adultos mayores  
**Cliente:** Sasuros / Scanleads  
**Inicio:** 17 mayo 2026  
**Objetivo:** Ayudar a personas mayores a entender cuánto están gastando realmente en una economía dolarizada

---

## 🎯 PROBLEMA A RESOLVER

**Situación actual:**
- Venezuela opera con precios en bolívares que cambian diariamente
- Personas mayores no saben cuánto están gastando en términos reales (dólares)
- Brecha entre tasa BCV oficial (~518 Bs/USD) y mercado P2P Binance (~693 Bs/USD)
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

**Stack tecnológico inicial:**
- Frontend: React (interfaz simple)
- Hosting: Netlify (gratis, rápido)
- APIs: bcvapi.tech + servicio tercero para Binance
- OCR (Fase 3): Tesseract.js

---

## 🗺️ ROADMAP DE DESARROLLO

### **FASE 1: MVP ULTRA SIMPLE** ⭐ (INICIO INMEDIATO)

**Objetivo:** App funcional en 24-48 horas

**Funcionalidades:**
- Input manual de monto en bolívares
- Botón grande "CALCULAR"
- Muestra resultado en USD (tasa BCV)
- Diseño minimalista, letras grandes
- Responsive (móvil primero)

**Criterios de éxito:**
- Mamá de Sasuros puede usarla sin ayuda
- Carga en menos de 2 segundos
- Funciona en cualquier teléfono

**APIs necesarias:**
- bcvapi.tech (plan gratuito: 50 consultas/mes)

**Archivos principales:**
```
/src
  /components
    CalculatorInput.jsx
    ResultDisplay.jsx
  App.jsx
  styles.css
```

---

### **FASE 2: COMPARACIÓN BCV vs BINANCE** (Después de Fase 1)

**Nuevas funcionalidades:**
- Mostrar DOS tasas: BCV oficial + Binance P2P
- Explicar diferencia con lenguaje simple:
  - "Según el banco (BCV)"
  - "En el mercado real (Binance)"
- Mostrar % de diferencia

**APIs adicionales:**
- Servicio para tasa Binance (a investigar: usdt.com.ve, exchangemonitor.net)

**Diseño propuesto:**
```
INGRESASTE: 1.500.000 Bs
━━━━━━━━━━━━━━━━━━━━━━━━
🏦 SEGÚN EL BANCO (BCV):
   $2,897 dólares

💰 EN EL MERCADO REAL:
   $2,163 dólares (Binance)
   
⚠️ Diferencia: 33.9%
━━━━━━━━━━━━━━━━━━━━━━━━
La tasa del mercado es más alta porque 
refleja la realidad de la calle.
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
- 🔄 Conversión inversa (USD → Bs)
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
- **BCV Oficial:** https://bcvapi.tech/api/v1/dolar
  - Plan gratuito: 50 consultas/mes
  - Requiere API Key (registro gratuito)
  
- **Binance USDT:** Por investigar
  - Opción 1: usdt.com.ve (si tiene API pública)
  - Opción 2: exchangemonitor.net
  - Opción 3: Crear scraper propio (Fase 5)

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
- ✅ Usuario entiende diferencia BCV vs Binance
- ✅ Actualización de tasas < 5 minutos
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

## 📁 ESTRUCTURA DE ARCHIVOS (Fase 1)

```
cuanto-es-en-dolares/
├── public/
│   ├── manifest.json          # PWA config
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── components/
│   │   ├── CalculatorInput.jsx
│   │   ├── ResultDisplay.jsx
│   │   └── LoadingSpinner.jsx
│   ├── services/
│   │   └── apiService.js      # Llamadas a APIs
│   ├── utils/
│   │   └── formatters.js      # Formateo de números
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── .env.local                 # API Keys
├── vite.config.js
├── package.json
└── README.md
```

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

1. **API Keys:**
   - Nunca exponerlas en frontend
   - Usar variables de entorno
   - Considerar proxy simple si necesario

2. **Límites de uso:**
   - Caché de tasas (no consultar en cada carga)
   - Actualizar cada 5-10 minutos máximo
   - Guardar última tasa en localStorage

3. **Privacidad:**
   - No guardar fotos de facturas
   - No rastrear información personal
   - Cumplir con transparencia de datos

---

## 📝 BITÁCORA DE DESARROLLO

### **17 Mayo 2026**
- ✅ Investigación de APIs (BCV, Binance)
- ✅ Análisis de tecnologías OCR
- ✅ Definición de roadmap
- ✅ Creación de documento maestro
- 🔄 **SIGUIENTE:** Iniciar desarrollo Fase 1 en Claude Code

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Configurar proyecto base en Claude Code:**
   - Crear estructura de carpetas
   - Instalar dependencias
   - Configurar Vite + React

2. **Obtener API Key de bcvapi.tech:**
   - Registrarse en https://www.bcvapi.tech/
   - Guardar API Key de forma segura
   - Testear endpoint

3. **Desarrollar componentes básicos:**
   - Input de bolivares (grande, claro)
   - Botón de calcular
   - Display de resultado

4. **Primera prueba con usuario real:**
   - Mamá de Sasuros
   - Observar qué no entiende
   - Ajustar inmediatamente

---

## 💡 NOTAS IMPORTANTES

- **Prioridad absoluta:** Simplicidad sobre features
- **Si hay duda de UX:** Preguntarle a una persona mayor
- **Cada feature:** Debe tener propósito claro
- **Mantra del proyecto:** "¿Mi mamá lo entendería?"

---

## 📞 RECURSOS Y CONTACTOS

**APIs:**
- BCV API: https://www.bcvapi.tech/
- Support: contacto@adsyssistemas.com

**Comunidad:**
- GitHub Issues (para bugs)
- Grupo de testers (WhatsApp)

**Referencias técnicas:**
- Tesseract.js docs: https://tesseract.projectnaptha.com/
- React PWA guide: https://create-react-app.dev/docs/making-a-progressive-web-app/

---

**Última actualización:** 17 mayo 2026  
**Versión del documento:** 1.0  
**Mantenido por:** Sasuros / Scanleads
