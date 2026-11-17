# Arquitectura del Sistema — UniShop

## 1. Visión General y Patrón Fan-Out Concurrente

UniShop actúa como un **Agregador de Compras Universal** sin bloquear el hilo principal ni penalizar al usuario por la latencia de la tienda más lenta. Para consultar simultáneamente **Amazon, Vinted, Wallapop, AliExpress y eBay**, el backend implementa un patrón **BFF (Backend-for-Frontend) + Concurrent Scatter-Gather Orchestrator**:

1. **API Gateway & Validación (`/api/search`)**:
   - Normaliza la consulta (`q`), los filtros (`stores`, `condition`, `minPrice`, `maxPrice`, `brandModel`, `sort`) y el contexto de cuentas conectadas del usuario.
2. **Orquestador Concurrente (`Promise.allSettled` + `AbortController`)**:
   - Lanza peticiones paralelas hacia los **5 adaptadores de tienda** con un presupuesto máximo de tiempo por adaptador (`timeoutMs = 2500ms`).
   - Gracias a `Promise.allSettled`, si una plataforma responde con `429 Rate Limited` o sufre un timeout, **las otras 4 plataformas devuelven resultados completos** y la UI notifica el estado parcial sin romperse.
   - Para cargas progresivas en producción, el endpoint soporta **Server-Sent Events (SSE)** para emitir lotes conforme responde cada tienda (primero caché/APIs oficiales en <150ms, luego scrapers/headless proxies).
3. **Estrategia Dual de Integración por Plataforma**:
   - **APIs Oficiales + OAuth 2.0**:
     - *Amazon*: Product Advertising API (PA-API 5.0) + Login with Amazon para carritos remotos (`CartCreate`).
     - *eBay*: Browse API + Buy Order API mediante OAuth 2.0.
     - *AliExpress*: AliExpress Open Platform (Dropshipping/Affiliate API) con firma HMAC-SHA256.
   - **Sincronización por Extensión de Navegador / Edge Proxy (Segunda Mano)**:
     - *Vinted y Wallapop*: No disponen de API pública abierta de escritura de carrito. UniShop utiliza una **WebExtension Companion** autorizada por el usuario que sincroniza cookies de sesión cifradas (`AES-256-GCM`) en `cuentas_vinculadas` y ejecuta consultas autenticadas a través de **Edge Workers rotativos** respetando `robots.txt` y límites de frecuencia.
4. **Capa de Normalización (Canonical Product DTO) y Caché**:
   - Todos los adaptadores transforman respuestas heterogéneas a un único esquema `Product` (`precio`, `gasto_envio`, `estado`, `marca`, `modelo`, `url_checkout`), permitiendo ordenación exacta y filtrado unificado en memoria/SQL.
   - **Caché L1/L2 (Redis)**: Las búsquedas frecuentes se cachean con TTL corto (90s para segunda mano, 5min para catálogo nuevo) reduciendo peticiones redundantes a los marketplaces en >70%.
5. **Checkout Híbrido**:
   - **Compra Individual**: Invoca `/api/checkout/session` para generar un enlace profundo pre-cargado (`deeplink`) o confirmar mediante API de compra rápida.
   - **Compra Múltiple ("Checkout Guiado")**: Agrupa los artículos por plataforma y orquesta un asistente secuencial que abre cada pasarela con el carrito pre-cargado y registra el avance (`pendiente` -> `completado`).
