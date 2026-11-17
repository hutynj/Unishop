export type StoreId = 'amazon' | 'vinted' | 'wallapop' | 'aliexpress' | 'ebay';

export type ProductCondition = 'new' | 'used' | 'refurbished';

export type ConditionFilter = 'all' | 'new' | 'secondhand';

export type SortOrder = 'relevance' | 'price_asc' | 'price_desc';

export type AuthMethod = 'oauth2' | 'extension_token';

export type ThemeMode = 'light' | 'dark';

export interface PricePoint {
  date: string;
  price: number;
  platform: string;
}

export interface PerformanceMetrics {
  potencia: number;
  autonomia: number;
  portabilidad: number;
  calidadPrecio: number;
  construccion: number;
}

export interface Product {
  id: string;
  externalId: string;
  store: StoreId;
  title: string;
  description: string;
  brand: string;
  model: string;
  category: string;
  condition: ProductCondition;
  price: number;
  originalPrice: number;
  previousPrice?: number;
  shippingCost: number;
  currency: 'EUR';
  imageUrl: string;
  storeUrl: string;
  sellerName: string;
  sellerRating: number;
  rating: number;
  reviewCount: number;
  stock: number;
  estimatedDelivery: string;
  inStock: boolean;
  priceHistory: PricePoint[];
  specs: Record<string, string | number>;
  performanceMetrics: PerformanceMetrics;
}

export interface LinkedAccount {
  store: StoreId;
  storeLabel: string;
  connected: boolean;
  authMethod: AuthMethod;
  accountHandle: string | null;
  lastSyncedAt: string | null;
  syncNote: string;
}

export type PlatformAccount = LinkedAccount;

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface OrderItem {
  productId: string;
  externalId: string;
  title: string;
  imageUrl: string;
  store: StoreId;
  quantity: number;
  unitPrice: number;
  shippingCost: number;
  lineTotal: number;
}

export type PaymentMethod = 'card' | 'paypal' | 'transfer';

export interface PaymentDetails {
  method: PaymentMethod;
  cardHolder?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  paypalEmail?: string;
  iban?: string;
  simulateError?: boolean;
}

export interface PaymentValidationResult {
  valid: boolean;
  errors: Partial<Record<'cardHolder' | 'cardNumber' | 'expiry' | 'cvv' | 'paypalEmail' | 'iban', string>>;
}

export type PushPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export interface PushNotificationState {
  supported: boolean;
  permission: PushPermissionStatus;
  enabled: boolean;
  lastSentAt: string | null;
  lastProductTitle: string | null;
}

export interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
  stores: StoreId[];
  itemsSubtotal: number;
  shippingTotal: number;
  totalPaid: number;
  checkoutMode: 'single' | 'guided';
  paymentMethod?: PaymentMethod;
  paymentSummary?: string;
}

export interface PriceAlert {
  productId: string;
  productTitle: string;
  brand: string;
  model: string;
  targetStore: StoreId;
  trackedPrice: number;
  enabled: boolean;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'price_drop' | 'account_sync' | 'order_confirmed';
  title: string;
  message: string;
  productId?: string;
  store?: StoreId;
  previousPrice?: number;
  newPrice?: number;
  createdAt: string;
  read: boolean;
}

export type AppNotification = Notification;

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
  resultCount: number;
}

export interface SearchFilters {
  query: string;
  category: string;
  stores: StoreId[];
  condition: ConditionFilter;
  minPrice: string;
  maxPrice: string;
  brandModel: string;
  sortBy: SortOrder;
  onlyConnectedStores: boolean;
}

export interface StoreCartGroup {
  store: StoreId;
  storeLabel: string;
  items: CartItem[];
  itemsSubtotal: number;
  shippingTotal: number;
  storeTotal: number;
  itemCount: number;
}

export interface CartTotals {
  itemsSubtotal: number;
  shippingTotal: number;
  grandTotal: number;
  totalQuantity: number;
  storeCount: number;
}

export interface CheckoutStoreStep {
  store: StoreId;
  storeLabel: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  checkoutUrl: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CheckoutPlan {
  mode: 'single' | 'guided';
  steps: CheckoutStoreStep[];
  grandTotal: number;
}
