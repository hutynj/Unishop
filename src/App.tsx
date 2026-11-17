import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BookmarkPlus,
  Link2,
  Moon,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import mockProductsJson from './data/mockProducts.json';
import type {
  CartItem,
  CheckoutPlan,
  CheckoutStoreStep,
  LinkedAccount,
  Notification,
  Order,
  PaymentMethod,
  PriceAlert,
  Product,
  SavedSearch,
  SearchFilters,
  StoreId,
} from './types/unishop';
import {
  addMultipleProductsToCart,
  ALL_STORES,
  appendPriceHistoryPoint,
  buildCheckoutPlan,
  calculateCartTotals,
  createOrderRecord,
  detectPriceDrops,
  filterAndSortProducts,
  isStoreConnected,
  type PageSizeOption,
  paginateProducts,
  simulatePriceUpdateForAlerts,
  STORE_META,
} from './utils/commerce';
import {
  MAX_COMPARE_ITEMS,
  toggleProductInCompareList,
} from './utils/comparison';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useTheme } from './hooks/useTheme';
import { AccountsPanel } from './components/AccountsPanel';
import { AiAssistantBar } from './components/AiAssistantBar';
import { ArchitectureView } from './components/ArchitectureView';
import { CatalogPaginationBar } from './components/CatalogPaginationBar';
import { ComparisonDrawer } from './components/ComparisonDrawer';
import { ComparisonFloatingBar } from './components/ComparisonFloatingBar';
import { FilterSidebar } from './components/FilterSidebar';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OrderHistoryPanel } from './components/OrderHistoryPanel';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SavedSearchesPanel } from './components/SavedSearchesPanel';
import { SimulatedCheckoutModal } from './components/SimulatedCheckoutModal';
import { ToastContainer, type ToastItem } from './components/ToastContainer';
import { UniversalCartDrawer } from './components/UniversalCartDrawer';

type ActiveTab = 'catalog' | 'orders' | 'accounts' | 'saved' | 'architecture';

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  stores: [...ALL_STORES],
  category: 'all',
  condition: 'all',
  minPrice: '',
  maxPrice: '',
  brandModel: '',
  sortBy: 'relevance',
  onlyConnectedStores: false,
};

const INITIAL_ACCOUNTS: LinkedAccount[] = [
  {
    store: 'amazon',
    storeLabel: 'Amazon',
    connected: true,
    authMethod: 'oauth2',
    accountHandle: 'carlos.m@correo.es',
    lastSyncedAt: '2026-11-16T08:05:00Z',
    syncNote: 'Sesión OAuth 2.0 activa (PA-API + Cart)',
  },
  {
    store: 'vinted',
    storeLabel: 'Vinted',
    connected: true,
    authMethod: 'extension_token',
    accountHandle: '@carlos_vintage',
    lastSyncedAt: '2026-11-16T08:02:00Z',
    syncNote: 'Sincronizada mediante extensión de navegador',
  },
  {
    store: 'wallapop',
    storeLabel: 'Wallapop',
    connected: true,
    authMethod: 'extension_token',
    accountHandle: 'Carlos M. (Madrid)',
    lastSyncedAt: '2026-11-16T07:58:00Z',
    syncNote: 'Token de sesión activo para Wallapop Envíos',
  },
  {
    store: 'aliexpress',
    storeLabel: 'AliExpress',
    connected: false,
    authMethod: 'oauth2',
    accountHandle: null,
    lastSyncedAt: null,
    syncNote: 'Pendiente de autorización OAuth',
  },
  {
    store: 'ebay',
    storeLabel: 'eBay',
    connected: true,
    authMethod: 'oauth2',
    accountHandle: 'cmartinez_es',
    lastSyncedAt: '2026-11-16T08:04:00Z',
    syncNote: 'OAuth 2.0 Browse & Buy Order activo',
  },
];

const STORAGE_KEYS = {
  cart: 'unishop_cart_v1',
  accounts: 'unishop_accounts_v1',
  savedSearches: 'unishop_saved_searches_v1',
  orders: 'app_order_history',
  priceAlerts: 'unishop_price_alerts_v1',
  notifications: 'unishop_notifications_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    pushState,
    requestPermission: requestPushPermission,
    setEnabled: setPushEnabled,
    sendPriceDropPush,
  } = usePushNotifications();

  const [liveProducts, setLiveProducts] = useState<Product[]>(
    () => mockProductsJson as unknown as Product[]
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  const [accounts, setAccounts] = useState<LinkedAccount[]>(() =>
    readStorage<LinkedAccount[]>(STORAGE_KEYS.accounts, INITIAL_ACCOUNTS)
  );
  const [cart, setCart] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    readStorage<Order[]>(STORAGE_KEYS.orders, [])
  );
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() =>
    readStorage<PriceAlert[]>(STORAGE_KEYS.priceAlerts, [])
  );
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    readStorage<Notification[]>(STORAGE_KEYS.notifications, [])
  );
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() =>
    readStorage<SavedSearch[]>(STORAGE_KEYS.savedSearches, [
      {
        id: 'saved-init-1',
        name: 'Tecnología Reacondicionada < 850 €',
        filters: {
          ...DEFAULT_FILTERS,
          condition: 'secondhand',
          maxPrice: '850',
          sortBy: 'price_asc',
        },
        createdAt: '2026-11-16T07:30:00Z',
        resultCount: 6,
      },
    ])
  );

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<CheckoutPlan | null>(null);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState(false);
  const [pageSize, setPageSize] = useState<PageSizeOption>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [preselectedAccountStore, setPreselectedAccountStore] = useState<StoreId | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const simTimeoutRef = useRef<number | null>(null);

  const pushToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 6500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
    } catch {
      // Ignore storage quota errors
    }
  }, [accounts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    } catch {
      // Ignore storage quota errors
    }
  }, [orders]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.priceAlerts, JSON.stringify(priceAlerts));
    } catch {
      // Ignore storage quota errors
    }
  }, [priceAlerts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    } catch {
      // Ignore storage quota errors
    }
  }, [notifications]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.savedSearches, JSON.stringify(savedSearches));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedSearches]);

  const filteredProducts = useMemo(
    () => filterAndSortProducts(liveProducts, filters, accounts),
    [liveProducts, filters, accounts]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  const pagination = useMemo(
    () => paginateProducts(filteredProducts, currentPage, pageSize),
    [filteredProducts, currentPage, pageSize]
  );

  const cartTotals = useMemo(() => calculateCartTotals(cart), [cart]);
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  const activeAlertsCount = useMemo(
    () => priceAlerts.filter((a) => a.enabled).length,
    [priceAlerts]
  );
  const disconnectedAccounts = useMemo(
    () => accounts.filter((a) => !a.connected),
    [accounts]
  );
  const detailProduct = useMemo(
    () => liveProducts.find((p) => p.id === detailProductId) ?? null,
    [liveProducts, detailProductId]
  );
  const isDetailProductAlertEnabled = useMemo(() => {
    if (!detailProduct) return false;
    return priceAlerts.some((a) => a.productId === detailProduct.id && a.enabled);
  }, [detailProduct, priceAlerts]);
  const comparedProducts = useMemo(
    () =>
      compareProductIds
        .map((id) => liveProducts.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [compareProductIds, liveProducts]
  );

  const latestSimRef = useRef({
    liveProducts,
    priceAlerts,
    accounts,
    sendPriceDropPush,
  });
  latestSimRef.current = {
    liveProducts,
    priceAlerts,
    accounts,
    sendPriceDropPush,
  };

  useEffect(() => {
    return () => {
      if (simTimeoutRef.current !== null) {
        window.clearTimeout(simTimeoutRef.current);
      }
    };
  }, []);

  const handleRequestConnectStore = (store: StoreId) => {
    setIsCartOpen(false);
    setPreselectedAccountStore(store);
    setActiveTab('accounts');
    pushToast({
      variant: 'warning',
      title: `Cuenta ${STORE_META[store].label} requerida`,
      message: `Vincula tu cuenta de ${STORE_META[store].label} para sincronizar, comprar o recibir alertas de esta tienda.`,
    });
  };

  const handleGlobalSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextFilters = { ...filters, query: searchInput };
    setFilters(nextFilters);
    setActiveTab('catalog');
    setIsSearchingApi(true);
    try {
      const params = new URLSearchParams({
        q: searchInput,
        stores: nextFilters.stores.join(','),
        category: nextFilters.category,
        condition: nextFilters.condition,
        minPrice: nextFilters.minPrice,
        maxPrice: nextFilters.maxPrice,
        brandModel: nextFilters.brandModel,
        sort: nextFilters.sortBy,
      });
      await fetch(`/api/search?${params.toString()}`);
    } catch {
      // Offline / PWA fallback continues seamlessly with local catalog
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!isStoreConnected(product.store, accounts)) {
      handleRequestConnectStore(product.store);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${product.id}`,
          product,
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const handleBulkAddAllPages = () => {
    if (filteredProducts.length === 0) return;

    const result = addMultipleProductsToCart(cart, filteredProducts, accounts);
    setCart(result.nextCart);

    if (result.addedUnits === 0 && result.skippedDisconnectedCount > 0) {
      const storeNames = result.skippedStores.map((s) => STORE_META[s].label).join(', ');
      pushToast({
        variant: 'warning',
        title: 'Vincula tus cuentas para añadir',
        message: `Los ${result.skippedDisconnectedCount} productos pertenecen a tiendas sin vincular (${storeNames}).`,
      });
      return;
    }

    if (result.addedUnits === 0) {
      pushToast({
        variant: 'info',
        title: 'Catálogo ya añadido al máximo de stock',
        message: 'Todos los productos disponibles de las tiendas conectadas ya están en tu carrito.',
      });
      return;
    }

    const skippedNote =
      result.skippedDisconnectedCount > 0
        ? ` (${result.skippedDisconnectedCount} de ${result.skippedStores.map((s) => STORE_META[s].label).join(', ')} omitidos por cuenta sin vincular).`
        : '.';

    pushToast({
      variant: 'info',
      title: `${result.addedUnits} productos añadidos al carrito`,
      message: `Se incluyeron todos los artículos disponibles de todas las páginas filtradas${skippedNote}`,
    });
  };

  const handleUpdateQuantity = (itemId: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== itemId));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: nextQty } : item))
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleQuickBuy = (product: Product) => {
    if (!isStoreConnected(product.store, accounts)) {
      handleRequestConnectStore(product.store);
      return;
    }

    const plan = buildCheckoutPlan([
      {
        id: `quick-${product.id}`,
        product,
        quantity: 1,
        addedAt: new Date().toISOString(),
      },
    ]);
    setCheckoutPlan(plan);
  };

  const handleStartCartCheckout = (itemsToCheckout: CartItem[]) => {
    const firstDisconnected = itemsToCheckout.find(
      (item) => !isStoreConnected(item.product.store, accounts)
    );
    if (firstDisconnected) {
      handleRequestConnectStore(firstDisconnected.product.store);
      return;
    }

    const plan = buildCheckoutPlan(itemsToCheckout);
    setIsCartOpen(false);
    setCheckoutPlan(plan);
  };

  const handleCheckoutCompleted = (
    plan: CheckoutPlan,
    completedSteps: CheckoutStoreStep[],
    paymentInfo: { method: PaymentMethod; summary: string }
  ): Order => {
    const completedSet = new Set(completedSteps.map((s) => s.store));
    const newOrder = createOrderRecord(
      plan,
      completedSteps,
      new Date().toISOString(),
      paymentInfo
    );

    setOrders((prev) => [newOrder, ...prev]);
    setCart((prev) => prev.filter((item) => !completedSet.has(item.product.store)));

    const orderNotification: Notification = {
      id: `notif-${Date.now().toString(36)}`,
      type: 'order_confirmed',
      title: `Pedido confirmado (${newOrder.id})`,
      message: `${newOrder.items.length} artículo(s) en ${completedSteps.map((s) => s.storeLabel).join(', ')} (${paymentInfo.summary}). Guardado en tu Historial de Pedidos.`,
      createdAt: newOrder.createdAt,
      read: false,
    };
    setNotifications((prev) => [orderNotification, ...prev]);

    pushToast({
      variant: 'info',
      title: `Pedido ${newOrder.id} guardado`,
      message: 'Tu compra se ha registrado en el Historial de Pedidos.',
    });

    return newOrder;
  };

  const handleTogglePriceAlert = (product: Product) => {
    if (!isStoreConnected(product.store, accounts)) {
      handleRequestConnectStore(product.store);
      return;
    }

    const existing = priceAlerts.find((a) => a.productId === product.id);
    const nextEnabled = !(existing?.enabled ?? false);

    setPriceAlerts((prev) => {
      if (existing) {
        return prev.map((a) =>
          a.productId === product.id
            ? {
                ...a,
                enabled: nextEnabled,
                trackedPrice: product.price,
                updatedAt: new Date().toISOString(),
              }
            : a
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productTitle: product.title,
          brand: product.brand,
          model: product.model,
          targetStore: product.store,
          trackedPrice: product.price,
          enabled: true,
          updatedAt: new Date().toISOString(),
        },
      ];
    });

    pushToast({
      variant: 'info',
      title: nextEnabled ? 'Alerta de precio activada' : 'Alerta desactivada',
      message: nextEnabled
        ? `Vigilando bajadas para ${product.title} en tus plataformas conectadas.`
        : `Has dejado de vigilar el precio de ${product.title}.`,
    });
  };

  const executePriceDropSimulation = useCallback(() => {
    const {
      liveProducts: currentProducts,
      priceAlerts: currentAlerts,
      accounts: currentAccounts,
      sendPriceDropPush: dispatchPush,
    } = latestSimRef.current;

    const eligibleAlerts = currentAlerts.filter(
      (a) => a.enabled && isStoreConnected(a.targetStore, currentAccounts)
    );

    if (eligibleAlerts.length === 0) {
      pushToast({
        variant: 'warning',
        title: 'Sin alertas activas en tiendas conectadas',
        message:
          'Añade un producto al carrito o abre su detalle y activa «Alerta» para monitorizar bajadas de precio.',
      });
      return;
    }

    const updatedProducts = simulatePriceUpdateForAlerts(
      currentProducts,
      currentAlerts,
      currentAccounts
    );
    const drops = detectPriceDrops(currentAlerts, updatedProducts, currentAccounts);

    if (drops.length === 0) {
      pushToast({
        variant: 'info',
        title: 'Precios actualizados',
        message: 'No se detectaron nuevas bajadas por debajo de tu precio vigilado.',
      });
      return;
    }

    setLiveProducts(updatedProducts);

    // Sync cart item prices with updated live catalog prices
    const updatedProductMap = new Map(updatedProducts.map((p) => [p.id, p]));
    setCart((prev) =>
      prev.map((item) => {
        const fresh = updatedProductMap.get(item.product.id);
        return fresh ? { ...item, product: fresh } : item;
      })
    );

    // Update trackedPrice to the new lowered baseline so subsequent simulations stay accurate
    const dropByAlertId = new Map(drops.map((d) => [d.alert.productId, d]));
    setPriceAlerts((prev) =>
      prev.map((a) => {
        const drop = dropByAlertId.get(a.productId);
        return drop
          ? {
              ...a,
              trackedPrice: drop.newPrice,
              updatedAt: new Date().toISOString(),
            }
          : a;
      })
    );

    const nowIso = new Date().toISOString();
    const newNotifications: Notification[] = drops.map((drop, index) => ({
      id: `notif-drop-${Date.now().toString(36)}-${index}`,
      type: 'price_drop',
      title: `Bajada de precio en ${STORE_META[drop.matchedProduct.store].label}`,
      message: `${drop.matchedProduct.title} ha bajado ${drop.savings.toFixed(2)} € respecto a tu precio vigilado.`,
      productId: drop.matchedProduct.id,
      store: drop.matchedProduct.store,
      previousPrice: drop.previousPrice,
      newPrice: drop.newPrice,
      createdAt: nowIso,
      read: false,
    }));

    setNotifications((prev) => [...newNotifications, ...prev]);

    for (const drop of drops) {
      pushToast({
        variant: 'price_drop',
        title: `¡Bajada de precio en ${STORE_META[drop.matchedProduct.store].label}!`,
        message: drop.matchedProduct.title,
        store: drop.matchedProduct.store,
        previousPrice: drop.previousPrice,
        newPrice: drop.newPrice,
      });

      dispatchPush({
        productId: drop.matchedProduct.id,
        productTitle: drop.matchedProduct.title,
        previousPrice: drop.previousPrice,
        newPrice: drop.newPrice,
        platformLabel: STORE_META[drop.matchedProduct.store].label,
        imageUrl: drop.matchedProduct.imageUrl,
        onFocusProduct: (focusedId) => {
          setActiveTab('catalog');
          setIsNotificationsOpen(false);
          setDetailProductId(focusedId);
        },
      });
    }
  }, [pushToast]);

  const handleSimulatePriceDrop = (delayMs: number = 0) => {
    const eligibleAlerts = priceAlerts.filter(
      (a) => a.enabled && isStoreConnected(a.targetStore, accounts)
    );

    if (eligibleAlerts.length === 0) {
      pushToast({
        variant: 'warning',
        title: 'Sin alertas activas en tiendas conectadas',
        message:
          'Añade un producto al carrito o abre su detalle y activa «Alerta» para monitorizar bajadas de precio.',
      });
      return;
    }

    if (delayMs > 0) {
      if (simTimeoutRef.current !== null) {
        window.clearTimeout(simTimeoutRef.current);
      }
      pushToast({
        variant: 'info',
        title: `Simulación programada (${Math.round(delayMs / 1000)}s)`,
        message:
          'Puedes minimizar el navegador ahora para verificar la notificación Push nativa del sistema.',
      });
      simTimeoutRef.current = window.setTimeout(() => {
        simTimeoutRef.current = null;
        executePriceDropSimulation();
      }, delayMs);
      return;
    }

    executePriceDropSimulation();
  };

  const handleSimulateProductPriceChange = (
    productId: string,
    direction: 'down' | 'up'
  ) => {
    const target = liveProducts.find((p) => p.id === productId);
    if (!target) return;

    const factor = direction === 'down' ? 0.88 : 1.08;
    const updatedProduct = appendPriceHistoryPoint(target, target.price * factor);
    const updatedProducts = liveProducts.map((p) =>
      p.id === productId ? updatedProduct : p
    );

    setLiveProducts(updatedProducts);
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, product: updatedProduct } : item
      )
    );

    if (direction === 'down') {
      const drops = detectPriceDrops(priceAlerts, updatedProducts, accounts).filter(
        (d) => d.matchedProduct.id === productId
      );

      if (drops.length > 0) {
        const drop = drops[0];
        setPriceAlerts((prev) =>
          prev.map((a) =>
            a.productId === drop.alert.productId
              ? {
                  ...a,
                  trackedPrice: drop.newPrice,
                  updatedAt: new Date().toISOString(),
                }
              : a
          )
        );

        const notif: Notification = {
          id: `notif-drop-${Date.now().toString(36)}`,
          type: 'price_drop',
          title: `Bajada de precio en ${STORE_META[updatedProduct.store].label}`,
          message: `${updatedProduct.title} ha bajado ${drop.savings.toFixed(2)} € respecto a tu precio vigilado.`,
          productId: updatedProduct.id,
          store: updatedProduct.store,
          previousPrice: drop.previousPrice,
          newPrice: drop.newPrice,
          createdAt: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev]);

        pushToast({
          variant: 'price_drop',
          title: `¡Bajada de precio en ${STORE_META[updatedProduct.store].label}!`,
          message: updatedProduct.title,
          store: updatedProduct.store,
          previousPrice: drop.previousPrice,
          newPrice: drop.newPrice,
        });

        sendPriceDropPush({
          productId: updatedProduct.id,
          productTitle: updatedProduct.title,
          previousPrice: drop.previousPrice,
          newPrice: drop.newPrice,
          platformLabel: STORE_META[updatedProduct.store].label,
          imageUrl: updatedProduct.imageUrl,
          onFocusProduct: (focusedId) => {
            setActiveTab('catalog');
            setIsNotificationsOpen(false);
            setDetailProductId(focusedId);
          },
        });
      } else {
        pushToast({
          variant: 'price_drop',
          title: 'Bajada simulada en historial (-12%)',
          message: `${updatedProduct.title} ahora cuesta ${updatedProduct.price.toFixed(2)} €`,
          store: updatedProduct.store,
          previousPrice: target.price,
          newPrice: updatedProduct.price,
        });
      }
    } else {
      pushToast({
        variant: 'info',
        title: 'Subida simulada en historial (+8%)',
        message: `${updatedProduct.title} actualizado a ${updatedProduct.price.toFixed(2)} €`,
      });
    }
  };

  const handleConnectAccount = (store: StoreId, handle: string) => {
    const nowIso = new Date().toISOString();
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.store === store
          ? {
              ...acc,
              connected: true,
              accountHandle: handle,
              lastSyncedAt: nowIso,
              syncNote:
                acc.authMethod === 'oauth2'
                  ? 'Sesión OAuth 2.0 autorizada'
                  : 'Token de extensión sincronizado',
            }
          : acc
      )
    );

    const syncNotification: Notification = {
      id: `notif-sync-${Date.now().toString(36)}`,
      type: 'account_sync',
      title: `Cuenta ${STORE_META[store].label} vinculada`,
      message: `Sincronizada como ${handle}. Ya puedes comprar y recibir alertas de precios de ${STORE_META[store].label}.`,
      store,
      createdAt: nowIso,
      read: false,
    };
    setNotifications((prev) => [syncNotification, ...prev]);

    pushToast({
      variant: 'info',
      title: `${STORE_META[store].label} conectada`,
      message: `Cuenta vinculada como ${handle}. Catálogo y alertas sincronizados.`,
    });
  };

  const handleDisconnectAccount = (store: StoreId) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.store === store
          ? {
              ...acc,
              connected: false,
              accountHandle: null,
              syncNote: 'Desconectado manualmente por el usuario',
            }
          : acc
      )
    );
    pushToast({
      variant: 'warning',
      title: `${STORE_META[store].label} desconectada`,
      message: `Se han pausado las compras y alertas de precios para ${STORE_META[store].label}.`,
    });
  };

  const handleSyncAllAccounts = () => {
    const now = new Date().toISOString();
    setAccounts((prev) =>
      prev.map((acc) => (acc.connected ? { ...acc, lastSyncedAt: now } : acc))
    );
    pushToast({
      variant: 'info',
      title: 'Sesiones sincronizadas',
      message: 'Se han actualizado las sesiones activas de tus tiendas conectadas.',
    });
  };

  const handleSaveCurrentSearch = () => {
    const labelParts: string[] = [];
    if (filters.query.trim()) labelParts.push(`"${filters.query.trim()}"`);
    if (filters.category !== 'all') labelParts.push(filters.category);
    if (filters.brandModel) labelParts.push(filters.brandModel);
    if (filters.condition === 'new') labelParts.push('Nuevo');
    if (filters.condition === 'secondhand') labelParts.push('Segunda mano');
    if (filters.minPrice || filters.maxPrice) {
      labelParts.push(`${filters.minPrice || '0'}–${filters.maxPrice || '∞'}€`);
    }
    const name =
      labelParts.length > 0
        ? labelParts.join(' · ')
        : `Búsqueda multi-tienda (${filters.stores.length} tiendas)`;

    const newSaved: SavedSearch = {
      id: `saved-${Date.now().toString(36)}`,
      name,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
      resultCount: filteredProducts.length,
    };
    setSavedSearches((prev) => [newSaved, ...prev]);
    pushToast({
      variant: 'info',
      title: 'Búsqueda guardada',
      message: `«${name}» añadida a tus búsquedas guardadas.`,
    });
  };

  const handleApplySavedSearch = (saved: SavedSearch) => {
    setFilters(saved.filters);
    setSearchInput(saved.filters.query);
    setActiveTab('catalog');
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
    setHighlightedProductId(null);
  };

  const handleToggleCompare = (product: Product) => {
    const { nextIds, limitReached } = toggleProductInCompareList(
      compareProductIds,
      product.id,
      MAX_COMPARE_ITEMS
    );

    if (limitReached) {
      pushToast({
        variant: 'warning',
        title: `Máximo ${MAX_COMPARE_ITEMS} productos`,
        message: 'Quita un artículo de la barra de comparación para añadir otro.',
      });
      return;
    }

    setCompareProductIds(nextIds);
  };

  const connectedStoresCount = accounts.filter((a) => a.connected).length;

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'catalog', label: 'Catálogo' },
    { id: 'orders', label: 'Historial de Pedidos' },
    { id: 'accounts', label: 'Cuentas' },
    { id: 'saved', label: 'Búsquedas' },
    { id: 'architecture', label: 'Arquitectura' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className="font-display text-xl font-extrabold tracking-tight text-slate-950 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            UniShop
          </button>

          {/* Zone 2: Primary Navigation */}
          <nav
            aria-label="Navegación principal"
            className="hidden lg:flex items-center gap-6 text-sm font-medium"
          >
            {navItems.map((navItem) => (
              <button
                key={navItem.id}
                type="button"
                data-testid={`nav-tab-${navItem.id}`}
                onClick={() => setActiveTab(navItem.id)}
                className={`border-b-2 py-5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === navItem.id
                    ? 'border-slate-900 font-semibold text-slate-950 dark:border-blue-400 dark:text-white'
                    : 'border-transparent text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {navItem.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Theme Toggle + Notifications Bell + Cart */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="theme-toggle-button"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={
                theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
              }
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="hidden sm:inline">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-slate-600" />
                  <span className="hidden sm:inline">Oscuro</span>
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="notifications-bell-button"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label={`Abrir panel de actividad y alertas (${unreadNotificationsCount} sin leer)`}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 && (
                <span
                  data-testid="unread-notifications-badge"
                  className="tabular-price font-mono absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white"
                >
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Abrir carrito universal (${cartTotals.totalQuantity} artículos)`}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Carrito</span>
              <span
                data-testid="header-cart-count"
                className="tabular-price font-mono rounded bg-white/15 px-1.5 py-0.5 text-[11px]"
              >
                {cartTotals.totalQuantity}
              </span>
            </button>
          </div>
        </div>

        {/* Tablet/Mobile secondary compact nav */}
        <div className="flex items-center gap-3.5 overflow-x-auto border-t border-slate-100 px-4 py-2 dark:border-slate-800 lg:hidden">
          {navItems.map((navItem) => (
            <button
              key={navItem.id}
              type="button"
              onClick={() => setActiveTab(navItem.id)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === navItem.id
                  ? 'font-bold text-slate-950 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {navItem.label}
            </button>
          ))}
        </div>
      </header>

      <main
        className={`mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8 ${
          comparedProducts.length > 0 ? 'pb-24' : ''
        }`}
      >
        {activeTab === 'catalog' && (
          <>
            {/* Search Hero & Toolbar */}
            <section
              aria-label="Buscador universal"
              className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div className="max-w-2xl">
                  <h1 className="text-2xl font-bold leading-[1.15] tracking-[-0.015em] text-slate-950 sm:text-3xl dark:text-white">
                    Busca en 5 marketplaces desde un solo lugar
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                    Consulta simultánea en Amazon, Vinted, Wallapop, AliExpress y eBay ·{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {connectedStoresCount} de {accounts.length} cuentas sincronizadas
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <PWAInstallButton />
                  <button
                    type="button"
                    onClick={handleSaveCurrentSearch}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    Guardar búsqueda
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleGlobalSearchSubmit}
                className="mt-5 flex flex-col gap-2.5 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <label htmlFor="global-search-input" className="sr-only">
                    Buscar productos en todas las tiendas
                  </label>
                  <input
                    id="global-search-input"
                    type="search"
                    value={searchInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchInput(val);
                      setFilters((prev) => ({ ...prev, query: val }));
                    }}
                    placeholder="Buscar producto, marca o modelo..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isSearchingApi ? 'Consultando...' : 'Buscar en todas'}
                </button>
              </form>

              {disconnectedAccounts.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <span>
                    Falta vincular:{' '}
                    <strong>
                      {disconnectedAccounts
                        .map((a) => STORE_META[a.store].label)
                        .join(', ')}
                    </strong>
                    . Conecta la plataforma para comprar o activar alertas de precios en sus productos.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRequestConnectStore(disconnectedAccounts[0].store)}
                    className="inline-flex items-center gap-1 font-semibold text-amber-900 underline hover:no-underline dark:text-amber-300 whitespace-nowrap cursor-pointer"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Ir a Cuentas Vinculadas
                  </button>
                </div>
              )}
            </section>

            {/* Main Workspace: Sidebar + Product Grid */}
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
              {/* Desktop Sidebar */}
              <div className="hidden lg:col-span-3 lg:block">
                <FilterSidebar
                  filters={filters}
                  allProducts={liveProducts}
                  linkedAccounts={accounts}
                  onChange={setFilters}
                  onReset={handleResetFilters}
                />
              </div>

              {/* Mobile Filter Trigger */}
              <div className="flex items-center justify-between lg:hidden">
                <span className="tabular-price text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {filteredProducts.length} resultados encontrados
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filtros
                </button>
              </div>

              {/* Mobile Filter Modal */}
              {isMobileFiltersOpen && (
                <div
                  className="fixed inset-0 z-50 flex justify-start bg-slate-950/50 dark:bg-black/70 lg:hidden"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Filtros móviles"
                >
                  <div className="h-full w-80 max-w-full overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Filtros
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsMobileFiltersOpen(false)}
                        aria-label="Cerrar filtros"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <FilterSidebar
                      filters={filters}
                      allProducts={liveProducts}
                      linkedAccounts={accounts}
                      onChange={setFilters}
                      onReset={handleResetFilters}
                    />
                  </div>
                </div>
              )}

              {/* Results Column */}
              <div className="lg:col-span-9">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Mostrando{' '}
                      <span
                        data-testid="results-count"
                        className="tabular-price font-semibold text-slate-950 dark:text-white"
                      >
                        {pageSize === 'all' || pagination.totalPages <= 1
                          ? filteredProducts.length
                          : `${pagination.startIndex}–${pagination.endIndex} de ${filteredProducts.length}`}
                      </span>{' '}
                      {pageSize === 'all' || pagination.totalPages <= 1 ? (
                        <>
                          de <span className="tabular-price">{liveProducts.length}</span> productos agregados
                        </>
                      ) : (
                        <>productos ({liveProducts.length} en total)</>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Tiendas activas:{' '}
                      {filters.stores.map((s) => STORE_META[s].label).join(' · ') || 'Ninguna'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="catalog-page-size" className="sr-only">
                      Productos por página
                    </label>
                    <select
                      id="catalog-page-size"
                      data-testid="catalog-page-size"
                      value={String(pageSize)}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setPageSize(raw === 'all' ? 'all' : (Number(raw) as PageSizeOption));
                      }}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="all">Todas las páginas ({filteredProducts.length})</option>
                      <option value="12">12 por página</option>
                      <option value="24">24 por página</option>
                    </select>

                    {filteredProducts.length > 0 && (
                      <button
                        type="button"
                        data-testid="bulk-add-all-btn"
                        onClick={handleBulkAddAllPages}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        Añadir todos al carrito
                      </button>
                    )}
                  </div>
                </div>

                <AiAssistantBar
                  visibleProducts={filteredProducts}
                  query={filters.query}
                  onHighlightProduct={setHighlightedProductId}
                />

                {filteredProducts.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Ningún producto coincide con tus filtros
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                      Prueba ampliando el rango de precios, activando más tiendas o limpiando la búsqueda actual.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
                    >
                      Restablecer todos los filtros
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      data-testid="product-grid"
                      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
                    >
                      {pagination.items.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isStoreConnected={isStoreConnected(product.store, accounts)}
                          onAddToCart={handleAddToCart}
                          onQuickBuy={handleQuickBuy}
                          onOpenDetail={(p) => setDetailProductId(p.id)}
                          onRequestConnectStore={handleRequestConnectStore}
                          isHighlighted={highlightedProductId === product.id}
                          isSelectedForCompare={compareProductIds.includes(product.id)}
                          compareLimitReached={compareProductIds.length >= MAX_COMPARE_ITEMS}
                          onToggleCompare={handleToggleCompare}
                        />
                      ))}
                    </div>

                    <CatalogPaginationBar
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.totalItems}
                      startIndex={pagination.startIndex}
                      endIndex={pagination.endIndex}
                      onPageChange={(nextPage) => {
                        setCurrentPage(nextPage);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onShowAllPages={() => setPageSize('all')}
                    />
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <OrderHistoryPanel
            orders={orders}
            onExploreCatalog={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsPanel
            accounts={accounts}
            preselectedStore={preselectedAccountStore}
            onClearPreselectedStore={() => setPreselectedAccountStore(null)}
            onConnect={handleConnectAccount}
            onDisconnect={handleDisconnectAccount}
            onSyncAll={handleSyncAllAccounts}
          />
        )}

        {activeTab === 'saved' && (
          <SavedSearchesPanel
            searches={savedSearches}
            onApplySearch={handleApplySavedSearch}
            onDeleteSearch={(id) =>
              setSavedSearches((prev) => prev.filter((item) => item.id !== id))
            }
          />
        )}

        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      <footer className="mt-14 border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8 dark:text-slate-400">
          <p>UniShop — Agregador de compras universal y carrito unificado.</p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              Historial de pedidos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              Cuentas vinculadas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              Arquitectura & SQL
            </button>
          </div>
        </div>
      </footer>

      <UniversalCartDrawer
        isOpen={isCartOpen}
        items={cart}
        accounts={accounts}
        priceAlerts={priceAlerts}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCart([])}
        onTogglePriceAlert={handleTogglePriceAlert}
        onSimulatePriceDrop={handleSimulatePriceDrop}
        onStartCheckout={handleStartCartCheckout}
        onRequestConnectStore={handleRequestConnectStore}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        notifications={notifications}
        activeAlertsCount={activeAlertsCount}
        pushState={pushState}
        onRequestPushPermission={requestPushPermission}
        onTogglePushEnabled={setPushEnabled}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onMarkRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        onClearAll={() => setNotifications([])}
        onSimulatePriceDrop={handleSimulatePriceDrop}
      />

      <ProductDetailModal
        product={detailProduct}
        allProducts={liveProducts}
        isStoreConnected={
          detailProduct ? isStoreConnected(detailProduct.store, accounts) : false
        }
        isAlertEnabled={isDetailProductAlertEnabled}
        onClose={() => setDetailProductId(null)}
        onAddToCart={handleAddToCart}
        onQuickBuy={handleQuickBuy}
        onTogglePriceAlert={handleTogglePriceAlert}
        onSimulateProductPriceChange={handleSimulateProductPriceChange}
        onRequestConnectStore={handleRequestConnectStore}
      />

      <SimulatedCheckoutModal
        plan={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        onCheckoutCompleted={handleCheckoutCompleted}
        onViewOrderHistory={() => setActiveTab('orders')}
      />

      <ComparisonFloatingBar
        products={comparedProducts}
        isDrawerOpen={isCompareDrawerOpen}
        onRemoveProduct={(id) =>
          setCompareProductIds((prev) => prev.filter((itemId) => itemId !== id))
        }
        onClearAll={() => setCompareProductIds([])}
        onOpenDrawer={() => setIsCompareDrawerOpen(true)}
      />

      <ComparisonDrawer
        isOpen={isCompareDrawerOpen}
        products={comparedProducts}
        accounts={accounts}
        onClose={() => setIsCompareDrawerOpen(false)}
        onRemoveProduct={(id) =>
          setCompareProductIds((prev) => prev.filter((itemId) => itemId !== id))
        }
        onClearAll={() => setCompareProductIds([])}
        onAddToCart={handleAddToCart}
        onRequestConnectStore={handleRequestConnectStore}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        offsetForFloatingBar={compareProductIds.length > 0 && !isCompareDrawerOpen}
      />
      <OfflineIndicator />
    </div>
  );
}
