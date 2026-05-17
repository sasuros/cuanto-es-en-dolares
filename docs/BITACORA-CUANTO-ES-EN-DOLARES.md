# 📓 BITÁCORA DE DESARROLLO - ¿Cuánto es en Dólares?

**Proyecto:** Calculadora conversión Bs → USD para adultos mayores  
**Desarrollador:** Sasuros  
**Inicio:** 17 mayo 2026

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

### **Domingo 18 - Día 2: Desarrollo Fase 1**

_[Por completar]_

#### ✅ COMPLETADO

#### 🔄 EN PROGRESO

#### ❌ BLOQUEADORES

#### 📝 NOTAS DEL DÍA

#### 🎯 PRÓXIMOS PASOS

---

## 📊 MÉTRICAS DE PROGRESO

**Fase 1 (MVP Ultra Simple):**
- Progreso: 10% (solo investigación y docs)
- Estimado restante: 4-6 horas
- Bloqueadores: Ninguno
- Confianza: 🟢 Alta

**Fase 2 (Comparación BCV vs Binance):**
- Progreso: 0%
- Dependencia: Completar Fase 1
- Riesgo: 🟡 Medio (API Binance no oficial)

**Fase 3 (OCR):**
- Progreso: 0%
- Dependencia: Validar que usuarios usen Fase 1-2
- Riesgo: 🟡 Medio (precisión OCR)

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
