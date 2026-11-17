import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import type { Product, StoreId } from './src/types/unishop';
import { ALL_STORES, STORE_META, filterAndSortProducts } from './src/utils/commerce';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Load mock catalog from JSON once at startup
const catalogPath = path.resolve(__dirname, 'src/data/mockProducts.json');
const catalogProducts: Product[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

// Shared Gemini client on server only (free-tier compatible gemini-4-hydrogen)
const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface AdapterMetrics {
  store: StoreId;
  ok: boolean;
  count: number;
  latencyMs: number;
  source: 'official_api' | 'extension_proxy';
}

async function queryMarketplaceAdapter(
  store: StoreId,
  allProducts: Product[],
  signal: AbortSignal
): Promise<{ store: StoreId; items: Product[]; latencyMs: number; source: 'official_api' | 'extension_proxy' }> {
  const start = Date.now();
  const simulatedDelay = store === 'amazon' || store === 'ebay' ? 35 : 65;

  await new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error(`Timeout en adaptador ${store}`));
      return;
    }
    const timer = setTimeout(resolve, simulatedDelay);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error(`Timeout en adaptador ${store}`));
      },
      { once: true }
    );
  });

  const items = allProducts.filter((p) => p.store === store);
  const source = store === 'vinted' || store === 'wallapop' ? 'extension_proxy' : 'official_api';
  return {
    store,
    items,
    latencyMs: Date.now() - start,
    source,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'unishop-aggregator', timestamp: new Date().toISOString() });
  });

  // Concurrent scatter-gather search across all selected marketplaces
  app.get('/api/search', async (req, res) => {
    try {
      const q = String(req.query.q ?? '');
      const condition = String(req.query.condition ?? 'all') as 'all' | 'new' | 'secondhand';
      const minPrice = String(req.query.minPrice ?? '');
      const maxPrice = String(req.query.maxPrice ?? '');
      const brandModel = String(req.query.brandModel ?? '');
      const sortBy = String(req.query.sort ?? 'relevance') as 'relevance' | 'price_asc' | 'price_desc';
      const storesParam = String(req.query.stores ?? ALL_STORES.join(','));
      const requestedStores = storesParam
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is StoreId => ALL_STORES.includes(s as StoreId));

      const activeStores = requestedStores.length > 0 ? requestedStores : ALL_STORES;

      // Fan-out with per-adapter timeout protection (non-blocking)
      const settled = await Promise.allSettled(
        activeStores.map((store) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          return queryMarketplaceAdapter(store, catalogProducts, controller.signal).finally(() =>
            clearTimeout(timeoutId)
          );
        })
      );

      const aggregated: Product[] = [];
      const adapters: AdapterMetrics[] = [];

      settled.forEach((result, idx) => {
        const store = activeStores[idx];
        if (result.status === 'fulfilled') {
          aggregated.push(...result.value.items);
          adapters.push({
            store,
            ok: true,
            count: result.value.items.length,
            latencyMs: result.value.latencyMs,
            source: result.value.source,
          });
        } else {
          adapters.push({
            store,
            ok: false,
            count: 0,
            latencyMs: 2500,
            source: store === 'vinted' || store === 'wallapop' ? 'extension_proxy' : 'official_api',
          });
        }
      });

      const defaultAccounts = ALL_STORES.map((store) => ({
        store,
        storeLabel: STORE_META[store].label,
        connected: true,
        authMethod: (store === 'vinted' || store === 'wallapop' ? 'extension_token' : 'oauth2') as
          | 'oauth2'
          | 'extension_token',
        accountHandle: null,
        lastSyncedAt: null,
        syncNote: '',
      }));

      const results = filterAndSortProducts(
        aggregated,
        {
          query: q,
          category: String(req.query.category ?? 'all'),
          stores: activeStores,
          condition,
          minPrice,
          maxPrice,
          brandModel,
          sortBy,
          onlyConnectedStores: false,
        },
        defaultAccounts
      );

      res.json({
        results,
        total: results.length,
        adapters,
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al consultar los marketplaces concurrentemente.' });
    }
  });

  // Prepare hybrid checkout session links
  app.post('/api/checkout/session', (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) {
      res.status(400).json({ error: 'El carrito está vacío.' });
      return;
    }

    const sessionId = `uni_chk_${Date.now().toString(36)}`;
    res.json({
      sessionId,
      createdAt: new Date().toISOString(),
      status: 'ready',
    });
  });

  // Gemini-powered Smart Offer Comparison & Buying Recommendation (uses gemini-4-hydrogen)
  app.post('/api/ai/analyze', async (req, res) => {
    const items: Product[] = Array.isArray(req.body?.products) ? req.body.products.slice(0, 10) : [];
    const query: string = String(req.body?.query ?? '');

    if (items.length === 0) {
      res.status(400).json({ error: 'No hay productos visibles para analizar.' });
      return;
    }

    const buildFallbackSummary = () => {
      const sortedByTotal = [...items].sort(
        (a, b) => a.price + a.shippingCost - (b.price + b.shippingCost)
      );
      const bestValue = sortedByTotal[0];
      const freeShippingCount = items.filter((p) => p.shippingCost === 0).length;
      return {
        bestPickId: bestValue.id,
        bestPickTitle: bestValue.title,
        summary: `Entre las ${items.length} ofertas analizadas, la opción más económica puesta en casa es "${bestValue.title}" en ${STORE_META[bestValue.store].label} por ${(bestValue.price + bestValue.shippingCost).toFixed(2)} € (envío incluido). Además, ${freeShippingCount} producto(s) ofrecen envío gratuito.`,
        tips: [
          `Compara el coste total con envío: ${STORE_META[bestValue.store].label} lidera en precio final.`,
          'Verifica el estado del artículo (Nuevo frente a Reacondicionado o Segunda mano) antes de finalizar el pago.',
        ],
        poweredBy: 'local_heuristic',
      };
    };

    if (!aiClient) {
      res.json(buildFallbackSummary());
      return;
    }

    try {
      const compactCatalog = items.map((p) => ({
        id: p.id,
        tienda: STORE_META[p.store].label,
        titulo: p.title,
        marca: p.brand,
        modelo: p.model,
        estado: p.condition,
        precioEur: p.price,
        envioEur: p.shippingCost,
        entrega: p.estimatedDelivery,
      }));

      const response = await Promise.race([
        aiClient.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Analiza estas ofertas agregadas de UniShop (consulta: "${query || 'catálogo completo'}") y recomienda en español la mejor opción calidad-precio considerando precio, envío, estado y entrega:\n${JSON.stringify(compactCatalog)}`,
          config: {
            systemInstruction:
              'Eres un asesor experto en compras online para UniShop. Responde siempre en español claro, directo y útil, máximo 2 frases para el resumen y 2 consejos concretos.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                bestPickId: { type: Type.STRING, description: 'ID del producto más recomendable' },
                bestPickTitle: { type: Type.STRING, description: 'Título corto del producto recomendado' },
                summary: { type: Type.STRING, description: 'Resumen comparativo en español de máximo 2 frases' },
                tips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Dos consejos breves para decidir la compra',
                },
              },
              required: ['bestPickId', 'bestPickTitle', 'summary', 'tips'],
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout')), 5500)
        ),
      ]);

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        bestPickId: parsed.bestPickId || items[0].id,
        bestPickTitle: parsed.bestPickTitle || items[0].title,
        summary: parsed.summary || buildFallbackSummary().summary,
        tips: Array.isArray(parsed.tips) && parsed.tips.length > 0 ? parsed.tips : buildFallbackSummary().tips,
        poweredBy: 'gemini-4-hydrogen',
      });
    } catch {
      res.json(buildFallbackSummary());
    }
  });

  const httpServer = http.createServer(app);

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        allowedHosts: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`UniShop server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start UniShop server:', err);
  process.exit(1);
});
