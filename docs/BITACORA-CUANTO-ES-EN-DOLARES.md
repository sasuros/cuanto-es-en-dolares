# 📓 BITÁCORA DE DESARROLLO - ¿Cuánto es en Dólares?

**Proyecto:** Calculadora conversión Bs → USD para adultos mayores  
**Desarrollador:** Sasuros  
**Inicio:** 17 mayo 2026

---

## 📅 JULIO 2026

### **Martes 14 - Sprint 1: Reactivación (v0.5.0)**

#### ✅ COMPLETADO

**Problema detectado:**
- bcvapi.tech agotó la cuota gratuita de 50 consultas/mes.
- La app seguía mostrando una tasa vieja (~530 Bs/USD) mientras la tasa vigente rondaba ~724 Bs/USD.
- La dependencia de API key + Netlify Function ya no era sostenible para una app de uso diario.

**Migración de API:**
- ✅ API principal migrada a `https://ve.dolarapi.com/v1/dolares/oficial`.
- ✅ Fetch directo desde el frontend, sin proxy y sin API key.
- ✅ Fallback legado a `bcvapi.tech` si DolarAPI falla.
- ✅ Parser adaptado a `fechaActualizacion` ISO 8601.
- ✅ Protección contra tasa futura mantenida.

**Arquitectura simplificada:**
- ✅ Eliminada `netlify/functions/bcv-rate.mjs`.
- ✅ `netlify.toml` simplificado a build + SPA fallback + headers.
- ✅ Proxy de Vite eliminado.
- ✅ `.env.example` ya no pide `BCV_API_KEY`.
- ✅ Caché `bcv-rate-cache-v2` con TTL de 30 minutos.
- ✅ Limpieza automática de keys obsoletas del localStorage.

**Validación:**
- ✅ Build exitoso.
- ✅ Bundle verificado con 0 API keys.
- ✅ Producción deployada y usando DolarAPI.

### **Martes 14 - Sprint 2: Tasa Paralela (v0.6.0)**

#### ✅ COMPLETADO

**Nueva fuente de datos:**
- ✅ Endpoint principal actualizado a `https://ve.dolarapi.com/v1/dolares`.
- ✅ Una sola llamada obtiene BCV oficial + paralelo.
- ✅ Si la tasa paralela no viene disponible, la app degrada a solo BCV sin romper.
- ✅ Fallback a `/v1/dolares/oficial` para mantener cálculos con BCV.

**UI complementaria:**
- ✅ `InitialRateCard` muestra tasa paralela como referencia secundaria.
- ✅ Brecha BCV vs paralelo calculada automáticamente:
  - Verde cuando paralelo < BCV.
  - Naranja cuando paralelo > BCV.
- ✅ `ResultDisplay` muestra resultado alternativo "Con paralelo" después de calcular.
- ✅ Modo "Otra tasa" no muestra comparación paralela.
- ✅ Los cálculos principales siguen usando BCV siempre.

**Documentación:**
- ✅ README raíz reescrito para v0.6.0.
- ✅ Documento maestro actualizado: Fase 2 completada.
- ✅ Bitácora actualizada con Sprints 1 y 2.

---

## 📅 MAYO 2026

### **Sábado 17 - Día 1: Investigación y Planificación**

#### ✅ COMPLETADO

**Investigación de APIs (3 horas):**
- ✅ Investigado APIs del Banco Central de Venezuela
  - Confirmado: bcvapi.tech es la opción más confiable
  - Plan gratuito: 50 consultas/mes
  - Requiere registro para API Key
  - Endpoint: `https://bcvapi.tech/api/v1/dolar`
  - Respuesta JSON simple: `{tasa: 517.96, fecha: "2026-05-16"}`

- ✅ Investigado tasas Binance P2P
  - ⚠️ NO existe API pública oficial de Binance para P2P VES/USDT
  - Alternativas verificadas:
    - exchangemonitor.net (actualiza cada 5-10 min)
    - usdt.com.ve (actualiza cada 5 min)
    - dolitoday.com
  - Precio actual: ~693 Bs/USDT vs 518 Bs/USD (BCV)
  - Brecha: 34.5%

- ✅ Investigado tecnologías OCR
  - Tesseract.js: Mejor opción para navegador
  - Asprise Receipt OCR: API de pago especializada
  - Veryfi: Premium, extrae 50+ campos
  - Tabscanner: Especializada en recibos
  - **Decisión:** Empezar con Tesseract.js (gratis, funciona en navegador)

**Definición de arquitectura:**
- ✅ Decidido: Web App Progresiva (PWA)
  - Razón: Accesibilidad para adultos mayores sin instalación compleja
  - Un link → Guardar en pantalla de inicio → Listo
- ✅ Stack elegido:
  - Frontend: React 18 + Vite
  - Hosting: Netlify (gratis)
  - APIs: bcvapi.tech + tercero para Binance
- ✅ Roadmap definido en 5 fases

**Documentación:**
- ✅ Creado documento maestro completo
- ✅ Creado esta bitácora
- ✅ Definidos principios de diseño para adultos mayores

**Decisiones clave tomadas:**
1. ✅ Empezar con MVP ultra simple (solo input manual)
2. ✅ Priorizar texto grande y botones enormes
3. ✅ Diferir OCR a Fase 3 (validar uso primero)
4. ✅ Mostrar ambas tasas (BCV + Binance) desde Fase 2

#### 🔄 EN PROGRESO

**Pendiente registro API:**
- 🔄 Registrarme en bcvapi.tech para obtener API Key
- 🔄 Testear endpoint con Postman/curl

**Pendiente investigación:**
- 🔄 Confirmar si usdt.com.ve o exchangemonitor.net tienen API pública
- 🔄 Definir estrategia de caché para no exceder límite de 50 consultas/mes

#### 📝 NOTAS DEL DÍA

**Insight importante:**
El problema real no es técnico sino de UX. Las personas mayores:
- No les importa la "tasa de cambio"
- Solo quieren saber: "¿Es caro o barato?"
- Necesitan un punto de referencia simple

**Idea para Fase 4:**
Agregar "calculadora de poder adquisitivo":
- Input: 1.500.000 Bs
- Output: "Equivale a comprar X paquetes de harina PAN"
- Usar referencias cotidianas venezolanas

**Feedback conceptual (Grupo de WhatsApp):**
- Mamá preguntó: "¿Y si no tengo internet?"
- **Solución:** PWA con caché → Última tasa guardada + timestamp visible
- Mensaje: "⚠️ Última actualización: hace 3 horas (sin internet)"

**Preocupación técnica:**
Si bcvapi.tech cae o cambia su API, toda la app se rompe.
**Solución propuesta:** Tener API de backup (bcv-exchange-rates en Vercel)

#### 🎯 PRÓXIMOS PASOS (Día 2)

1. **Configuración inicial:**
   - [ ] Crear proyecto Vite + React
   - [ ] Configurar Netlify deploy
   - [ ] Obtener API Key de bcvapi.tech
   - [ ] Testear llamada a API

2. **Desarrollo Fase 1:**
   - [ ] Componente: Input de bolivares
   - [ ] Componente: Botón calcular
   - [ ] Componente: Display resultado
   - [ ] Servicio: apiService.js para consultar BCV
   - [ ] Utils: formateo de números (1.500.000 vs 1500000)

3. **Primera prueba:**
   - [ ] Probar con mamá de Sasuros
   - [ ] Anotar TODO lo que no entienda
   - [ ] Ajustar texto/tamaño según feedback

**Tiempo estimado Fase 1:** 4-6 horas de desarrollo
**Meta:** App funcional básica para el domingo 18 en la noche

---

### **Día 2: MVP Completo + Deploy a Producción**

#### ✅ COMPLETADO

**Estructura base (1h):**
- ✅ Proyecto Vite + React 18 inicializado
- ✅ `package.json`, `.gitignore`, `.env.example` definidos
- ✅ Estructura de carpetas (`src/components`, `src/services`, `src/utils`)
- ✅ Vite config con plugin PWA (Workbox + auto-update)
- ✅ Iconos SVG (favicon + PWA icon en verde marca)
- ✅ Shell de `App.jsx` + `main.jsx` + reset CSS

**Modo oscuro WCAG AAA (30 min):**
- ✅ Paleta oscura completa con variables CSS
- ✅ Contrastes medidos en DOM: body texto 16.3:1, placeholder 7.7:1 → AAA
- ✅ #121212 (Material Design) como fondo base
- ✅ Texto oscuro sobre botón verde (10.2:1 — más legible que blanco)
- ✅ Variables de resplandor (`--glow-primary`, `--glow-focus`) preparadas
- ✅ `color-scheme: dark` declarado

**CalculatorInput (1h):**
- ✅ Input con formato venezolano (`Intl.NumberFormat('es-VE')` → 1.500.000)
- ✅ `inputMode="numeric"` → teclado numérico en móvil
- ✅ Botón X para limpiar (44px touch target)
- ✅ Botón CALCULAR de 80px con glow verde
- ✅ Enter dispara el cálculo
- ✅ Auto-deshabilitado durante loading
- ✅ Accesibilidad: aria-labels, focus visible, tabular-nums

**ResultDisplay (1h):**
- ✅ 3 estados: success / loading / error
- ✅ Resultado USD GIGANTE (56px / 72px en desktop) con text-shadow verde
- ✅ Tasa BCV destacada en azul (`517,96`)
- ✅ Fecha de publicación + tiempo relativo ("Consultada hace un momento")
- ✅ Loading con ⏳ rotando + "Buscando tasa actual…"
- ✅ Error con ⚠️, borde rojo sutil, mensajes amigables sin tecnicismos
- ✅ Animación fade-in + slide-up al aparecer
- ✅ ARIA: role=status (loading), role=alert (error), aria-live correctos

**Integración API BCV (1h):**
- ✅ `apiService.js` con `fetchBCVRate()`, `clearRateCache()`, `ApiError`
- ✅ Caché localStorage con TTL configurable
- ✅ Fallback a caché viejo si la red falla (marca `stale: true`)
- ✅ 7 tipos de error tipados (NETWORK, TIMEOUT, AUTH, QUOTA, SERVER, PARSE, CONFIG)
- ✅ `getFriendlyErrorMessage()` traduce a español sin tecnicismos
- ✅ Timeout de 8s para no bloquear al usuario

**Seguridad — Netlify Function (1.5h):**
- ✅ CORS detectado y resuelto (la API no soporta llamadas desde browser)
- ✅ `netlify/functions/bcv-rate.mjs` proxea la API server-side
- ✅ API key movida de `VITE_BCV_API_KEY` → `BCV_API_KEY` (sin prefijo)
- ✅ Vite proxy en dev también inyecta la key vía `loadEnv()` — nunca llega al cliente
- ✅ Verificado con `grep` en `dist/`: **0 matches de la key** en el bundle
- ✅ `Netlify-CDN-Cache-Control: public, s-maxage=43200, durable` → CDN comparte cache 12h
- ✅ Decisión arquitectónica: CDN cache > Netlify Blobs+cron (10% del código, 95% del beneficio)

**Documentación y git (30 min):**
- ✅ README.md en raíz con propuesta de valor, setup, stack, roadmap
- ✅ `git init` + identidad local `Scanleads <sasuros@gmail.com>` (sin tocar config global)
- ✅ 3 commits limpios: MVP inicial, fix de seguridad, README
- ✅ Push a `github.com/sasuros/cuanto-es-en-dolares` (branch `main`)

**Deploy a producción (15 min):**
- ✅ Sitio creado en Netlify desde GitHub (auto-detectado vía `netlify.toml`)
- ✅ Env var `BCV_API_KEY` configurada (scope: Functions)
- ✅ Build exitoso: 150 KB JS / 48 KB gzipped
- ✅ PWA generada: 9 entries precacheadas
- ✅ Function `/api/bcv` respondiendo correctamente

**🌐 URL DE PRODUCCIÓN:**
**https://cuantoeseldolares.netlify.app**

**📸 Prueba real en producción:**
- Input: `1.500.000 Bs`
- Resultado: **$2,895.97 USD** ✅
- Tasa BCV: `517,96` Bs/USD ✅
- _Screenshot: pendiente subir a `docs/screenshots/produccion.png`_

#### 📝 NOTAS DEL DÍA

**Lección aprendida 1 — La API BCV bloquea CORS:**
Funciona con `curl` pero el navegador hace preflight `OPTIONS` que el servidor responde con 404. Solución: proxy. Primero usé Vite proxy en dev + Netlify redirect en prod, pero el redirect dejaba la key en el bundle. Migré a una Netlify Function que mantiene la key server-side.

**Lección aprendida 2 — `VITE_*` env vars son públicas:**
Cualquier variable con prefijo `VITE_` en `.env.local` termina inyectada en el bundle JS. La API key estaba expuesta. Renombré a `BCV_API_KEY` (sin prefijo) y la function la lee de `process.env`. En dev, `loadEnv()` la inyecta como header HTTP en el proxy.

**Decisión clave — Caché compartido vs distribuido:**
Una propuesta alternativa fue usar Netlify Blobs + Scheduled Function (cron diario a las 4 PM VET). Lo rechazamos: ~250 líneas de código operacional para resolver un problema que aún no existe (5 usuarios reales hoy, no 1000). En su lugar:
- CDN cache de Netlify (12h) → respuesta compartida entre todos los usuarios
- localStorage del cliente (10min dev / 6h prod)
- Quota estimada: ~44 consultas/mes (cuota gratis: 50) ✅

Si en 6 meses llegamos a 500 usuarios reales y rebasamos cuota → ENTONCES migramos a Blobs. Por ahora: simple, funcional, mantenible.

**Métricas reales:**
- Build de producción: 150 KB (48 KB gzipped) — muy ligero
- Primer paint estimado: <1 segundo en 4G
- Cumple criterio MAESTRO: "Carga en menos de 2 segundos" ✅
- Bundle 100% sin la API key (verificado con `grep` en `dist/`)

**Imprevisto resuelto:**
El path del proyecto (`05_PROYECTO_ cuanto-es-en-dolares`) tiene un espacio que rompió el preview server con `npm --prefix` y con `cmd /c`. Solucionado usando PowerShell en `.claude/launch.json`. Tomar nota: evitar espacios en nombres de carpetas futuras.

#### 🎯 PRÓXIMOS PASOS (Día 3+)

> ⚠️ **REGLA DEL PROYECTO:** No se agregan features hasta validar Fase 1 con
> usuario real. Tentación de agregar conversión inversa USD→Bs fue rechazada
> conscientemente — eso es Fase 4 después de feedback.

**Inmediato (días) — VALIDACIÓN, no desarrollo:**
- [ ] Tu mamá prueba la app en producción (prueba de fuego real)
- [ ] Observar QUÉ no entiende, QUÉ duda, QUÉ confunde
- [ ] Capturar screenshots de la app live para el README
- [ ] Compartir URL con 3-5 testers familiares por WhatsApp
- [ ] Anotar TODO lo que confunde a usuarios mayores (la app perfecta nace de feedback)
- [ ] Decisión post-feedback: ¿qué duele más? Eso es lo que va en v0.2.0.

**Corto plazo (semana 1):**
- [ ] Dominio custom (sugerido: `cuantoesendolares.com`)
- [ ] Renombrar subdominio Netlify de `cute-pie-8c46bd` a algo memorable
- [ ] Iterar mejoras basadas en feedback de testers

**Fase 2 (siguientes 2 semanas):**
- [ ] Investigar API/scraper para tasa Binance P2P
- [ ] Implementar UI dual: "Según el banco (BCV)" vs "En el mercado real (Binance)"
- [ ] Mostrar % de diferencia con explicación simple
- [ ] Decisión: ¿usar caché compartido también para Binance o consulta directa?

**Fase 3 (cuando Fase 2 esté validada):**
- [ ] Investigar Tesseract.js para OCR de facturas
- [ ] Prototipo de cámara → detectar monto total

---

### **Día 3: Iteraciones con feedback real (19-20 Mayo 2026)**

> 🎉 **Hito:** La pausa de validación con la mamá funcionó. Probó v0.1.0 y
> dio feedback concreto. Se entregaron 4 versiones en ~24 horas, cada una
> respondiendo a observación real (no a suposiciones).

#### ✅ COMPLETADO — 4 versiones deployadas

---

#### **v0.2.0 — Conversión bidireccional Bs↔USD** (19 May, commit `f4f8a7f`)

**Feedback que disparó la feature:**
> _"Me dicen \$50 en la tienda, no sé cuántos bolívares son."_ — mamá de Sasuros

Después de probar v0.1.0 (solo Bs→USD), pidió expresamente la conversión inversa.
Validación real → la feature pasó a estar justificada (no fue suposición).

**Implementación:**
- Estado `mode` en `App.jsx` (`'bs-to-usd'` | `'usd-to-bs'`)
- Toggle ⇄ 44×44px en la esquina superior derecha del label
- Lógica dual de cálculo: `amount / tasa` (Bs→USD) o `amount * tasa` (USD→Bs)
- `CalculatorInput.jsx` adapta format/parse según modo (numérico vs decimal)
- `inputMode` cambia entre `numeric` y `decimal` → distinto teclado en móvil
- `ResultDisplay.jsx` con texto adaptativo:
  - Bs→USD: _"Son aproximadamente \$X por Y Bs"_
  - USD→Bs: _"Necesitas Y Bs para \$X"_
- Nuevas utilidades en `formatters.js`: `formatUSDInput`, `parseUSDInput`

**🐛 Bug atrapado en testing:**
`formatBolivares()` recibía floats (de `amount × tasa`) y producía números monstruosos
por representación IEEE 754: `"26.045.710.000.000.004 Bs"` en lugar de `26.046 Bs`.
Fix: detectar `typeof value === 'number'` y `Math.round()` antes de formatear.

**Testing:**
- ✅ Bs → USD: `1.500.000 Bs → $2,879.55`
- ✅ USD → Bs entero: `$50 → 26.046 Bs`
- ✅ USD → Bs con decimales: `$12.50 → 6.511 Bs`
- ✅ Toggle limpia input + resultado al cambiar modo

**Decisión clave de UX:**
**Un solo botón ⇄, no dos botones grandes "Bs→USD" / "USD→Bs".**
Una propuesta original tenía dos botones tipo radio. Se descartó porque añadía
carga cognitiva. Para adultos mayores: menos elementos visibles = más claridad.

---

#### **v0.2.1 — Toggle más visible con texto** (19 May, commit `26d2521`)

**Feedback que disparó el cambio:**
Pasamos v0.2.0 al móvil y la mamá no vio el ⇄ chiquito en la esquina.
Demasiado sutil.

**Implementación:**
- Botón pill centrado (56px alto, máx 320px ancho)
- **Icono ⇄ + TEXTO adaptativo:**
  - "Cambiar a dólares" cuando está en modo Bs
  - "Cambiar a bolívares" cuando está en modo USD
- El texto cambia según _destino_ (no según estado actual) → más claro
- Animación: rotación 180° del icono en hover (mantiene la pista visual)

**Decisión clave de UX:**
**Para adultos mayores, icono + texto siempre supera a icono solo.**
La mamá no tiene que adivinar qué hace el ⇄ — el texto se lo dice.
Patrón aplicable a cualquier control no obvio en este perfil de usuario.

---

#### **v0.2.2 — Indicador de vigencia (HOY vs MAÑANA)** (20 May, commit `e22577c`)

**Bug verificado (no hipotético):**
El BCV publica la tasa del día _siguiente_ entre las 3-4 PM VET. Los comercios
en Venezuela siguen cobrando con la tasa _vigente HOY_, no con la "de mañana".
Sin un indicador claro, la mamá podía asumir que la tasa mostrada es la que
está cobrando el comercio → diferencia real al pagar.

Verificación: comparamos lo que mostraba la app con lo que estaba cobrando
un comercio en Venezuela. Confirmadas tasas distintas.

**Implementación (fix simple, no over-engineered):**
- Etiqueta visual **debajo de la tasa BCV**:
  - ✅ Verde "Vigente: HOY" si la fecha del API es hoy en Venezuela
  - ⚠️ Naranja "Vigente desde: mañana" si la fecha es futura
- Parser de fechas en español (`"Martes, 19 Mayo 2026"`) en `formatters.js`
- Comparación contra hoy en zona horaria `America/Caracas` (vía
  `Intl.DateTimeFormat` con `timeZone` — no usa reloj del usuario)
- Comparación por año/mes/día (sin horas → evita bugs sutiles)

**Testing (5 casos):**
- ✅ today, future, past, invalid, empty — todos correctos

**Decisión clave de arquitectura:**
**NO rechazar la tasa futura. Solo etiquetarla.**
La propuesta original era "si fecha > hoy, descartar y usar caché viejo".
Se rechazó porque:
- Edge cases sin resolver (¿qué pasa si no hay caché?)
- Esconde información útil al usuario que sí quiere planificar
- ~100 líneas de código vs ~15 líneas del label visual

El usuario decide, no la app. Más transparente.

---

#### **v0.3.0 — InitialRateCard: tasa visible al abrir** (20 May, commit `c8edc44`)

**Feedback que disparó la feature:**
La mamá decía: _"Solo quiero saber a cuánto está el dólar hoy."_
Tenía que inventar un monto y hacer un cálculo para ver la tasa. Fricción.

**Implementación:**
- Componente nuevo `src/components/InitialRateCard.jsx`
- `useEffect` en `App.jsx` con `fetchBCVRate()` al montar la app (con cleanup
  `cancelled` para evitar setState después de unmount en StrictMode)
- **Mutua exclusión con `ResultDisplay`** (mismo espacio en el DOM):
  - Sin cálculo activo → `InitialRateCard` (variante `--info`)
  - Con cálculo / loading / error → `ResultDisplay`
- Click en X → limpia resultado + reaparece `InitialRateCard`
- Sincronización inteligente: tras un cálculo exitoso, `initialRate` se
  actualiza con la tasa más reciente
- Reutilización máxima: mismas clases `.result-display`, mismo
  `getRateValidity`, mismo `fetchBCVRate`

**Testing (5 casos):**
- ✅ Abrir app → loading → card con tasa
- ✅ Hacer cálculo → `InitialRateCard` reemplazada por `ResultDisplay`
- ✅ Click X → resultado limpio, card vuelve
- ✅ Sin internet → fallback a caché (cubierto por código existente)
- ✅ Cambiar modo sin calcular → card permanece, no re-fetch

**Decisión clave de jerarquía visual:**
**Tasa contextual más pequeña (44px / 56px desktop) que el resultado
del cálculo (56px / 72px desktop).**
La tasa es contexto. El resultado del cálculo es el "wow moment". La jerarquía
de tamaños lo refleja.

---

#### 🎯 Estado actual y próximos pasos

**🚀 Producción estable:**
- 5 versiones publicadas (v0.1.0 → v0.3.0)
- Bundle: 50 KB gzipped
- API key 100% server-side (verificado con `grep` en bundle de producción)
- 0 bugs reportados
- Cuota estimada: ~25 consultas/mes (cuota gratis: 50)

**🛑 Desarrollo PAUSADO de nuevo:**
Mismo principio que llevamos respetando todo el proyecto.
**No se agrega ninguna feature más sin feedback real de usuarios usando v0.3.0.**

**Inmediato (días) — VALIDACIÓN, no desarrollo:**
- [ ] Mamá usa v0.3.0 en su rutina diaria varios días
- [ ] Observar: ¿ahora sí ve la tasa al abrir?, ¿usa el toggle?,
  ¿se confunde con "Vigente: HOY" vs "mañana"?
- [ ] Compartir URL con 3-5 testers familiares más
- [ ] Capturar screenshots reales para README
- [ ] Anotar TODO lo que confunde — la app perfecta nace de feedback

**Si surge un caso de uso nuevo y validado:**
- Implementar como v0.3.x si es ajuste, v0.4.0 si es feature
- Seguir el patrón ship → observe → iterate

#### 📝 NOTAS DEL DÍA — Lecciones de las iteraciones

**Patrón que funcionó: el commit-pequeño-tag-rápido.**
4 versiones en 24h, cada una tageada. Permite rollback granular si una rompe
algo, y comunica claramente "este cambio existe y está documentado".

**Push-back funciona cuando es honesto.**
Dos veces el flujo de chat propuso features de Fase 4 mezcladas en specs de
arreglos pequeños (botones grandes innecesarios, KV+cron antes de tiempo,
rechazo de tasas futuras con fallback complejo). Sostener el principio de
simplicidad y pedir validación antes de codear evitó horas de over-engineering.

**Capturar bugs en testing es barato. En producción es caro.**
El bug del IEEE 754 con `formatBolivares()` salió en preview, no en producción.
El usuario nunca vio `26.045.710.000.000.004 Bs`. Probar cada cambio en
preview antes de commit es disciplina que paga.

---

## 📊 MÉTRICAS DE PROGRESO

**Fase 1 (MVP Ultra Simple):** ✅ **COMPLETADA + ITERADA con feedback real**
- Progreso: **100%** 🎉
- Tiempo real invertido: ~6h MVP inicial + ~3h iteraciones = ~9h total
- Versiones publicadas: **5** (`v0.1.0`, `v0.2.0`, `v0.2.1`, `v0.2.2`, `v0.3.0`)
- Features finales en producción:
  - Conversión bidireccional Bs↔USD
  - Indicador de vigencia ("Vigente: HOY" / "Vigente desde: mañana")
  - Tasa visible al abrir la app (sin tener que calcular)
  - PWA instalable, offline-first
  - API key server-side (Netlify Function + CDN cache 12h)
- Bloqueadores resueltos: CORS, exposición de API key, bug de tasa futura
- En producción: https://cuantoeseldolares.netlify.app
- **🛑 Estado:** Desarrollo **PAUSADO** de nuevo. Esperando feedback real
  de v0.3.0 antes de cualquier feature nueva.

**Fase 2 (Comparación BCV vs Binance):**
- Progreso: 0%
- Dependencia: Validar v0.3.0 con usuarios reales por varios días
- Riesgo: 🟡 Medio (API Binance no oficial — scraper o terceros)

**Fase 3 (OCR):**
- Progreso: 0%
- Dependencia: Fase 2 estable + feedback de usuarios sobre fricción al tipear
- Riesgo: 🟡 Medio (precisión OCR con facturas reales)

**Versión actual en producción:** `v0.3.0`
**Branch principal:** `main`
**Último deploy:** 20 mayo 2026

---

## 🐛 BUGS Y PROBLEMAS

_[Ninguno aún - proyecto no iniciado]_

---

## 💡 IDEAS Y MEJORAS FUTURAS

**Ideas recogidas:**

1. **Calculadora inversa rápida:**
   - "Tengo $100, ¿cuántos bolívares necesito?"
   - Útil para presupuestar compras

2. **Referencias cotidianas:**
   - "1.500.000 Bs = 3 kg de carne"
   - "1.500.000 Bs = 15 paquetes de pasta"
   - Contextualizar con productos reales

3. **Alertas WhatsApp:**
   - "La brecha BCV-Binance subió a 40%"
   - Útil para quienes manejan dólares

4. **Modo "Super Simple":**
   - Solo un campo gigante y un resultado
   - Ni siquiera mostrar tasas, solo el resultado final
   - Toggle para "Modo Avanzado"

5. **Integración con DJ Request:**
   - Calcular precios de eventos en USD real
   - Mostrar al cliente cuánto es en su moneda local

---

## 📚 RECURSOS Y APRENDIZAJES

**APIs descubiertas:**
- bcvapi.tech (principal)
- bcv-exchange-rates.vercel.app (backup)
- exchangemonitor.net (Binance)
- usdt.com.ve (Binance)

**Librerías útiles:**
- Tesseract.js para OCR
- Workbox para PWA offline
- Intl.NumberFormat para formateo de números

**Artículos leídos:**
- [Documentación bcvapi.tech](https://www.bcvapi.tech/)
- [Guía OCR con JavaScript](https://www.edenai.co/post/how-to-use-ocr-with-javascript)
- [PWA con React](https://create-react-app.dev/docs/making-a-progressive-web-app/)

**Lecciones aprendidas:**
1. Binance NO tiene API pública para P2P → Necesitas scraper o terceros
2. Límite de 50 consultas/mes requiere estrategia de caché inteligente
3. Diseño para adultos mayores = Menos es MÁS

---

## 🎨 DECISIONES DE DISEÑO

**Paleta de colores (propuesta):**
- Verde: #2ECC71 (botón calcular, éxito)
- Azul: #3498DB (información, BCV)
- Naranja: #F39C12 (alerta, Binance)
- Gris oscuro: #2C3E50 (texto principal)
- Blanco: #FFFFFF (fondo)

**Tipografía:**
- Font: System font (-apple-system, BlinkMacSystemFont, "Segoe UI")
- Tamaños:
  - Input: 32px
  - Resultado: 48px (muy grande)
  - Labels: 18px
  - Ayuda: 16px

**Espaciado:**
- Padding botones: 20px vertical
- Margin entre elementos: 24px
- Border radius: 12px (esquinas suaves)

---

## 🔒 SEGURIDAD Y PRIVACIDAD

**Medidas implementadas:**
- [ ] API Key en variables de entorno (no en código)
- [ ] Rate limiting en consultas a APIs
- [ ] No guardar fotos de facturas en servidor
- [ ] LocalStorage solo para caché de tasas
- [ ] HTTPS obligatorio (Netlify lo da gratis)

**Política de privacidad (para futuro):**
- No recopilamos datos personales
- No rastreamos ubicación
- No compartimos información con terceros
- Tasas se consultan de APIs públicas

---

## 📞 CONTACTOS Y AYUDA

**APIs:**
- bcvapi.tech support: contacto@adsyssistemas.com
- WhatsApp support: +58-412-0560926

**Testers:**
- Mamá de Sasuros (usuario principal)
- Mamá de novia de Sasuros
- [Agregar más según se expanda]

**Comunidad:**
- [Crear grupo de WhatsApp de testers]
- [Considerar Discord para feedback técnico]

---

## 📈 MÉTRICAS DE USO (Cuando se lance)

_[Por implementar con Analytics]_

**KPIs a medir:**
- Conversiones por día
- Tiempo promedio en app
- Tasa de rebote
- Conversiones que usan OCR vs manual
- Consultas a BCV vs Binance

**Objetivo inicial:**
- 20 usuarios activos semanales
- 5 conversiones por usuario por semana
- 90% de satisfacción en encuesta post-uso

---

**Última actualización:** 17 mayo 2026 - 23:30 VET  
**Próxima entrada:** 18 mayo 2026
