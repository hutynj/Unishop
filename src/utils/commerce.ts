import type {
  CartItem,
  CartTotals,
  CheckoutPlan,
  CheckoutStoreStep,
  LinkedAccount,
  Order,
  OrderItem,
  PaymentDetails,
  PaymentMethod,
  PaymentValidationResult,
  PriceAlert,
  PricePoint,
  Product,
  SearchFilters,
  StoreCartGroup,
  StoreId,
} from '../types/unishop';

export const STORE_META: Record<
  StoreId,
  {
    label: string;
    accentHex: string;
    bgTint: string;
    textHex: string;
    authMethodLabel: string;
  }
> = {
  amazon: {
    label: 'Amazon',
    accentHex: '#FF9900',
    bgTint: '#FFF7ED',
    textHex: '#9A3412',
    authMethodLabel: 'OAuth 2.0 (PA-API)',
  },
  vinted: {
    label: 'Vinted',
    accentHex: '#007782',
    bgTint: '#ECFEFF',
    textHex: '#155E75',
    authMethodLabel: 'Extensión / Token de sesión',
  },
  wallapop: {
    label: 'Wallapop',
    accentHex: '#13C1AC',
    bgTint: '#F0FDFA',
    textHex: '#115E59',
    authMethodLabel: 'Extensión / Token de sesión',
  },
  aliexpress: {
    label: 'AliExpress',
    accentHex: '#E62E04',
    bgTint: '#FEF2F2',
    textHex: '#991B1B',
    authMethodLabel: 'OAuth 2.0 (Open Platform)',
  },
  ebay: {
    label: 'eBay',
    accentHex: '#0064D2',
    bgTint: '#EFF6FF',
    textHex: '#1E40AF',
    authMethodLabel: 'OAuth 2.0 (Browse API)',
  },
};

export const ALL_STORES: StoreId[] = ['amazon', 'vinted', 'wallapop', 'aliexpress', 'ebay'];

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getConditionLabel(condition: Product['condition']): string {
  switch (condition) {
    case 'new':
      return 'Nuevo';
    case 'used':
      return 'Segunda mano';
    case 'refurbished':
      return 'Reacondicionado';
  }
}

export function isStoreConnected(store: StoreId, linkedAccounts: LinkedAccount[]): boolean {
  return linkedAccounts.some((acc) => acc.store === store && acc.connected);
}

export function filterAndSortProducts(
  products: Product[],
  filters: SearchFilters,
  linkedAccounts: LinkedAccount[]
): Product[] {
  const connectedStoreSet = new Set(
    linkedAccounts.filter((acc) => acc.connected).map((acc) => acc.store)
  );
  const query = filters.query.trim().toLowerCase();
  const minVal = filters.minPrice !== '' ? Number(filters.minPrice) : null;
  const maxVal = filters.maxPrice !== '' ? Number(filters.maxPrice) : null;
  const targetBrandModel = filters.brandModel.trim().toLowerCase();
  const targetCategory = (filters.category || 'all').trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (!filters.stores.includes(product.store)) {
      return false;
    }

    if (filters.onlyConnectedStores && !connectedStoreSet.has(product.store)) {
      return false;
    }

    if (targetCategory !== '' && targetCategory !== 'all') {
      if (product.category.toLowerCase() !== targetCategory) {
        return false;
      }
    }

    if (filters.condition === 'new' && product.condition !== 'new') {
      return false;
    }

    if (
      filters.condition === 'secondhand' &&
      product.condition !== 'used' &&
      product.condition !== 'refurbished'
    ) {
      return false;
    }

    if (minVal !== null && !Number.isNaN(minVal) && product.price < minVal) {
      return false;
    }

    if (maxVal !== null && !Number.isNaN(maxVal) && product.price > maxVal) {
      return false;
    }

    if (targetBrandModel !== '' && targetBrandModel !== 'all') {
      const exactCandidate = `${product.brand} ${product.model}`.toLowerCase();
      const brandMatch = product.brand.toLowerCase() === targetBrandModel;
      const modelMatch = product.model.toLowerCase() === targetBrandModel;
      if (exactCandidate !== targetBrandModel && !brandMatch && !modelMatch) {
        return false;
      }
    }

    if (query.length > 0) {
      const haystack = `${product.title} ${product.description} ${product.brand} ${product.model} ${product.category} ${STORE_META[product.store].label}`.toLowerCase();
      const tokens = query.split(/\s+/).filter(Boolean);
      const allMatch = tokens.every((token) => haystack.includes(token));
      if (!allMatch) {
        return false;
      }
    }

    return true;
  });

  if (filters.sortBy === 'price_asc') {
    return [...filtered].sort((a, b) => a.price - b.price);
  }

  if (filters.sortBy === 'price_desc') {
    return [...filtered].sort((a, b) => b.price - a.price);
  }

  return filtered;
}

export function groupCartByStore(cartItems: CartItem[]): StoreCartGroup[] {
  const map = new Map<StoreId, CartItem[]>();

  for (const item of cartItems) {
    const existing = map.get(item.product.store) ?? [];
    existing.push(item);
    map.set(item.product.store, existing);
  }

  const groups: StoreCartGroup[] = [];
  for (const store of ALL_STORES) {
    const items = map.get(store);
    if (!items || items.length === 0) continue;

    const itemsSubtotal = roundMoney(
      items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    );
    const shippingTotal = roundMoney(
      items.reduce((maxShip, item) => Math.max(maxShip, item.product.shippingCost), 0)
    );
    const storeTotal = roundMoney(itemsSubtotal + shippingTotal);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    groups.push({
      store,
      storeLabel: STORE_META[store].label,
      items,
      itemsSubtotal,
      shippingTotal,
      storeTotal,
      itemCount,
    });
  }

  return groups;
}

export function calculateCartTotals(cartItems: CartItem[]): CartTotals {
  const groups = groupCartByStore(cartItems);
  const itemsSubtotal = roundMoney(groups.reduce((sum, g) => sum + g.itemsSubtotal, 0));
  const shippingTotal = roundMoney(groups.reduce((sum, g) => sum + g.shippingTotal, 0));
  const grandTotal = roundMoney(itemsSubtotal + shippingTotal);
  const totalQuantity = groups.reduce((sum, g) => sum + g.itemCount, 0);

  return {
    itemsSubtotal,
    shippingTotal,
    grandTotal,
    totalQuantity,
    storeCount: groups.length,
  };
}

export function buildCheckoutPlan(cartItems: CartItem[]): CheckoutPlan {
  const groups = groupCartByStore(cartItems);
  const totals = calculateCartTotals(cartItems);

  const steps: CheckoutStoreStep[] = groups.map((group) => ({
    store: group.store,
    storeLabel: group.storeLabel,
    items: group.items,
    subtotal: group.itemsSubtotal,
    shipping: group.shippingTotal,
    total: group.storeTotal,
    checkoutUrl:
      group.items.length === 1
        ? group.items[0].product.storeUrl
        : `${group.items[0].product.storeUrl}?unishop_batch=${group.items.map((i) => i.product.externalId).join(',')}`,
    status: 'pending',
  }));

  return {
    mode: steps.length <= 1 ? 'single' : 'guided',
    steps,
    grandTotal: totals.grandTotal,
  };
}

export function createOrderRecord(
  plan: CheckoutPlan,
  completedSteps: CheckoutStoreStep[],
  nowIso: string = new Date().toISOString(),
  paymentInfo?: { method: PaymentMethod; summary: string }
): Order {
  const items: OrderItem[] = completedSteps.flatMap((step) =>
    step.items.map((cartItem) => ({
      productId: cartItem.product.id,
      externalId: cartItem.product.externalId,
      title: cartItem.product.title,
      imageUrl: cartItem.product.imageUrl,
      store: cartItem.product.store,
      quantity: cartItem.quantity,
      unitPrice: cartItem.product.price,
      shippingCost: cartItem.product.shippingCost,
      lineTotal: roundMoney(cartItem.product.price * cartItem.quantity),
    }))
  );

  const itemsSubtotal = roundMoney(completedSteps.reduce((sum, s) => sum + s.subtotal, 0));
  const shippingTotal = roundMoney(completedSteps.reduce((sum, s) => sum + s.shipping, 0));
  const totalPaid = roundMoney(itemsSubtotal + shippingTotal);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  return {
    id: `ORD-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`,
    createdAt: nowIso,
    items,
    stores: completedSteps.map((s) => s.store),
    itemsSubtotal,
    shippingTotal,
    totalPaid,
    checkoutMode: plan.mode,
    paymentMethod: paymentInfo?.method,
    paymentSummary: paymentInfo?.summary,
  };
}

export function appendPriceHistoryPoint(
  product: Product,
  nextPrice: number,
  dateStr: string = new Date().toISOString().slice(0, 10)
): Product {
  const roundedNext = Math.max(1, roundMoney(nextPrice));
  const nextPoint: PricePoint = {
    date: dateStr,
    price: roundedNext,
    platform: STORE_META[product.store].label,
  };

  return {
    ...product,
    previousPrice: product.price,
    price: roundedNext,
    priceHistory: [...(product.priceHistory ?? []), nextPoint],
  };
}

export interface PriceDropMatch {
  alert: PriceAlert;
  matchedProduct: Product;
  previousPrice: number;
  newPrice: number;
  savings: number;
}

/**
 * Compares active price alerts against all products across connected platforms.
 * Business rule: only connected stores can deliver price-drop alerts.
 */
export function detectPriceDrops(
  alerts: PriceAlert[],
  catalogProducts: Product[],
  linkedAccounts: LinkedAccount[]
): PriceDropMatch[] {
  const connectedStores = new Set(
    linkedAccounts.filter((acc) => acc.connected).map((acc) => acc.store)
  );
  const drops: PriceDropMatch[] = [];

  for (const alert of alerts) {
    if (!alert.enabled) continue;
    if (!connectedStores.has(alert.targetStore)) continue;

    const candidates = catalogProducts.filter((product) => {
      if (!connectedStores.has(product.store)) return false;
      const sameProduct = product.id === alert.productId;
      const sameModel =
        product.brand.toLowerCase() === alert.brand.toLowerCase() &&
        product.model.toLowerCase() === alert.model.toLowerCase();
      return (sameProduct || sameModel) && product.price < alert.trackedPrice;
    });

    if (candidates.length === 0) continue;

    const bestOffer = [...candidates].sort((a, b) => a.price - b.price)[0];
    const savings = roundMoney(alert.trackedPrice - bestOffer.price);

    if (savings > 0) {
      drops.push({
        alert,
        matchedProduct: bestOffer,
        previousPrice: alert.trackedPrice,
        newPrice: bestOffer.price,
        savings,
      });
    }
  }

  return drops;
}

/**
 * Simulates a realistic price drop (15% off) on watched items across connected platforms
 * and appends the new point to priceHistory in real time.
 */
export function simulatePriceUpdateForAlerts(
  products: Product[],
  alerts: PriceAlert[],
  linkedAccounts: LinkedAccount[],
  dateStr: string = new Date().toISOString().slice(0, 10)
): Product[] {
  const connectedStores = new Set(
    linkedAccounts.filter((acc) => acc.connected).map((acc) => acc.store)
  );

  const activeAlerts = alerts.filter(
    (a) => a.enabled && connectedStores.has(a.targetStore)
  );

  if (activeAlerts.length === 0) {
    return products;
  }

  const targetIds = new Set<string>();
  for (const alert of activeAlerts) {
    const crossPlatformMatch = products.find(
      (p) =>
        connectedStores.has(p.store) &&
        p.id !== alert.productId &&
        p.brand.toLowerCase() === alert.brand.toLowerCase() &&
        p.model.toLowerCase() === alert.model.toLowerCase()
    );
    if (crossPlatformMatch) {
      targetIds.add(crossPlatformMatch.id);
    } else {
      targetIds.add(alert.productId);
    }
  }

  return products.map((product) => {
    if (!targetIds.has(product.id)) return product;
    const discounted = Math.max(1, roundMoney(product.price * 0.85));
    return appendPriceHistoryPoint(product, discounted, dateStr);
  });
}

export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiryInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function detectCardBrand(cardNumber: string): 'Visa' | 'Mastercard' | 'Amex' | 'Tarjeta' {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  return 'Tarjeta';
}

export function validatePaymentDetails(details: PaymentDetails): PaymentValidationResult {
  const errors: PaymentValidationResult['errors'] = {};

  if (details.method === 'card') {
    const holder = (details.cardHolder ?? '').trim();
    if (holder.length < 3) {
      errors.cardHolder = 'Introduce el nombre del titular tal como figura en la tarjeta.';
    }

    const digits = (details.cardNumber ?? '').replace(/\D/g, '');
    if (digits.length < 15 || digits.length > 16) {
      errors.cardNumber = 'El número de tarjeta debe tener 15 o 16 dígitos.';
    }

    const expiry = (details.expiry ?? '').trim();
    const expiryMatch = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
    if (!expiryMatch) {
      errors.expiry = 'Usa el formato MM/AA (ej. 08/28).';
    } else {
      const mm = Number(expiryMatch[1]);
      const yy = Number(expiryMatch[2]);
      const now = new Date();
      const currentYY = now.getFullYear() % 100;
      const currentMM = now.getMonth() + 1;
      if (yy < currentYY || (yy === currentYY && mm < currentMM)) {
        errors.expiry = 'La tarjeta introducida está caducada.';
      }
    }

    const cvv = (details.cvv ?? '').replace(/\D/g, '');
    if (cvv.length < 3 || cvv.length > 4) {
      errors.cvv = 'El código CVV debe tener 3 o 4 dígitos.';
    }
  } else if (details.method === 'paypal') {
    const email = (details.paypalEmail ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.paypalEmail = 'Introduce un correo electrónico válido de PayPal / Wallet.';
    }
  } else if (details.method === 'transfer') {
    const holder = (details.cardHolder ?? '').trim();
    if (holder.length < 3) {
      errors.cardHolder = 'Introduce el nombre completo del ordenante.';
    }
    const iban = (details.iban ?? '').replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,24}$/.test(iban)) {
      errors.iban = 'Introduce un IBAN válido (ej. ES91 2100 0418 4502 0005 1332).';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildPaymentSummary(details: PaymentDetails): string {
  if (details.method === 'card') {
    const digits = (details.cardNumber ?? '').replace(/\D/g, '');
    const last4 = digits.slice(-4) || '0000';
    return `${detectCardBrand(digits)} terminada en ${last4}`;
  }
  if (details.method === 'paypal') {
    return `PayPal (${(details.paypalEmail ?? '').trim()})`;
  }
  const cleanIban = (details.iban ?? '').replace(/\s+/g, '').toUpperCase();
  const tail = cleanIban.slice(-4) || '0000';
  return `Transferencia SEPA (*${tail})`;
}

export function buildReceiptText(order: Order): string {
  const lines: string[] = [
    '================================================',
    '            UNISHOP — RECIBO DE COMPRA          ',
    '================================================',
    `Pedido ID:       ${order.id}`,
    `Fecha:           ${new Date(order.createdAt).toLocaleString('es-ES')}`,
    `Método de pago:  ${order.paymentSummary ?? 'Pasarela UniShop'}`,
    `Tiendas:         ${order.stores.map((s) => STORE_META[s].label).join(', ')}`,
    '------------------------------------------------',
    'ARTÍCULOS:',
    ...order.items.map(
      (item) =>
        `  - ${item.quantity}x ${item.title} [${STORE_META[item.store].label}] -> ${formatCurrency(item.lineTotal)}`
    ),
    '------------------------------------------------',
    `Subtotal:        ${formatCurrency(order.itemsSubtotal)}`,
    `Envíos:          ${order.shippingTotal === 0 ? 'Gratis' : formatCurrency(order.shippingTotal)}`,
    `TOTAL PAGADO:    ${formatCurrency(order.totalPaid)}`,
    '================================================',
  ];
  return lines.join('\n');
}

export type PageSizeOption = 12 | 24 | 'all';

export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export function paginateProducts<T>(
  items: T[],
  requestedPage: number,
  pageSize: PageSizeOption
): PaginationResult<T> {
  const totalItems = items.length;
  if (totalItems === 0) {
    return {
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      startIndex: 0,
      endIndex: 0,
    };
  }

  if (pageSize === 'all') {
    return {
      items,
      currentPage: 1,
      totalPages: 1,
      totalItems,
      startIndex: 1,
      endIndex: totalItems,
    };
  }

  const safeSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const offset = (currentPage - 1) * safeSize;
  const pageItems = items.slice(offset, offset + safeSize);

  return {
    items: pageItems,
    currentPage,
    totalPages,
    totalItems,
    startIndex: offset + 1,
    endIndex: offset + pageItems.length,
  };
}

export interface BulkAddResult {
  nextCart: CartItem[];
  addedUnits: number;
  newlyAddedProducts: number;
  incrementedProducts: number;
  skippedDisconnectedCount: number;
  skippedOutOfStockCount: number;
  skippedStores: StoreId[];
}

export function addMultipleProductsToCart(
  currentCart: CartItem[],
  productsToAdd: Product[],
  linkedAccounts: LinkedAccount[],
  nowIso: string = new Date().toISOString()
): BulkAddResult {
  let nextCart = currentCart.map((item) => ({ ...item }));
  let addedUnits = 0;
  let newlyAddedProducts = 0;
  let incrementedProducts = 0;
  let skippedDisconnectedCount = 0;
  let skippedOutOfStockCount = 0;
  const skippedStoreSet = new Set<StoreId>();

  for (const product of productsToAdd) {
    if (!product.inStock || product.stock <= 0) {
      skippedOutOfStockCount += 1;
      continue;
    }
    if (!isStoreConnected(product.store, linkedAccounts)) {
      skippedDisconnectedCount += 1;
      skippedStoreSet.add(product.store);
      continue;
    }

    const existingIdx = nextCart.findIndex((item) => item.product.id === product.id);
    if (existingIdx >= 0) {
      const existing = nextCart[existingIdx];
      if (existing.quantity < product.stock) {
        nextCart[existingIdx] = { ...existing, quantity: existing.quantity + 1 };
        addedUnits += 1;
        incrementedProducts += 1;
      }
    } else {
      nextCart.push({
        id: `cart-${product.id}`,
        product,
        quantity: 1,
        addedAt: nowIso,
      });
      addedUnits += 1;
      newlyAddedProducts += 1;
    }
  }

  return {
    nextCart,
    addedUnits,
    newlyAddedProducts,
    incrementedProducts,
    skippedDisconnectedCount,
    skippedOutOfStockCount,
    skippedStores: Array.from(skippedStoreSet),
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
