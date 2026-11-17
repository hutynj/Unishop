import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  Loader2,
  Lock,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import type {
  CheckoutPlan,
  CheckoutStoreStep,
  Order,
  PaymentDetails,
  PaymentMethod,
  PaymentValidationResult,
} from '../types/unishop';
import {
  buildPaymentSummary,
  buildReceiptText,
  detectCardBrand,
  formatCardNumber,
  formatCurrency,
  formatExpiryInput,
  validatePaymentDetails,
} from '../utils/commerce';
import { StoreBadge } from './StoreBadge';

interface SimulatedCheckoutModalProps {
  plan: CheckoutPlan | null;
  onClose: () => void;
  onCheckoutCompleted: (
    plan: CheckoutPlan,
    completedSteps: CheckoutStoreStep[],
    paymentInfo: { method: PaymentMethod; summary: string }
  ) => Order;
  onViewOrderHistory: () => void;
}

type GatewayStatus = 'form' | 'processing' | 'rejected' | 'success';

export const SimulatedCheckoutModal: React.FC<SimulatedCheckoutModalProps> = ({
  plan,
  onClose,
  onCheckoutCompleted,
  onViewOrderHistory,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [iban, setIban] = useState('');
  const [simulateError, setSimulateError] = useState(false);

  const [validationErrors, setValidationErrors] = useState<PaymentValidationResult['errors']>({});
  const [status, setStatus] = useState<GatewayStatus>('form');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!plan) return;
    setStatus('form');
    setValidationErrors({});
    setConfirmedOrder(null);
    setSimulateError(false);
  }, [plan]);

  if (!plan || plan.steps.length === 0) return null;

  const cardBrand = detectCardBrand(cardNumber);

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();

    const details: PaymentDetails = {
      method,
      cardHolder,
      cardNumber,
      expiry,
      cvv,
      paypalEmail,
      iban,
      simulateError,
    };

    const validation = validatePaymentDetails(details);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});
    setStatus('processing');

    // Simulate realistic bank/gateway latency (1.6s)
    window.setTimeout(() => {
      if (simulateError) {
        setStatus('rejected');
        return;
      }

      const completedSteps: CheckoutStoreStep[] = plan.steps.map((s) => ({
        ...s,
        status: 'completed',
      }));
      const paymentInfo = {
        method,
        summary: buildPaymentSummary(details),
      };
      const createdOrder = onCheckoutCompleted(plan, completedSteps, paymentInfo);
      setConfirmedOrder(createdOrder);
      setStatus('success');
    }, 1600);
  };

  const handleDownloadReceipt = () => {
    if (!confirmedOrder) return;
    const content = buildReceiptText(confirmedOrder);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recibo-${confirmedOrder.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fillDemoCredentials = () => {
    setValidationErrors({});
    if (method === 'card') {
      setCardHolder('Carlos Martínez');
      setCardNumber('4242 4242 4242 4242');
      setExpiry('08/29');
      setCvv('842');
    } else if (method === 'paypal') {
      setPaypalEmail('carlos.m@correo.es');
    } else {
      setCardHolder('Carlos Martínez');
      setIban('ES91 2100 0418 4502 0005 1332');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 dark:bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulated-checkout-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="simulated-checkout-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Pasarela de Pago UniShop
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {plan.steps.length} tienda(s) · Total consolidado{' '}
              <span className="tabular-price font-mono font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(plan.grandTotal)}
              </span>
            </p>
          </div>
          {status !== 'processing' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar pasarela de pago"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6">
          {status === 'processing' && (
            <div
              data-testid="payment-processing-state"
              className="flex flex-col items-center justify-center py-14 text-center"
            >
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                Procesando pago con el banco...
              </h3>
              <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Verificando autorización segura y preparando las órdenes en{' '}
                {plan.steps.map((s) => s.storeLabel).join(', ')}.
              </p>
            </div>
          )}

          {status === 'rejected' && (
            <div
              data-testid="payment-rejected-state"
              className="space-y-5 py-6 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Pago rechazado por la entidad emisora
                </h3>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
                  No se ha realizado ningún cargo y tu carrito permanece intacto. Desactiva la simulación de error o prueba con otro método de pago.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSimulateError(false);
                    setStatus('form');
                  }}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
                >
                  Volver a intentar el pago
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {status === 'success' && confirmedOrder && (
            <div data-testid="payment-success-state" className="space-y-5 py-3">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
                  Pago autorizado y compra confirmada
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Pedido{' '}
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {confirmedOrder.id}
                  </span>{' '}
                  · {confirmedOrder.paymentSummary}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-950/60">
                <div className="space-y-2">
                  {confirmedOrder.items.map((item, idx) => (
                    <div
                      key={`${item.productId}-${idx}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <StoreBadge store={item.store} size="sm" />
                        <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                          {item.quantity}x {item.title}
                        </span>
                      </div>
                      <span className="tabular-price font-mono font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2.5 text-sm font-bold text-slate-950 dark:border-slate-800 dark:text-white">
                  <span>Total abonado</span>
                  <span className="tabular-price font-mono">
                    {formatCurrency(confirmedOrder.totalPaid)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar recibo (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewOrderHistory();
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
                >
                  Ver Historial de Pedidos
                </button>
              </div>
            </div>
          )}

          {status === 'form' && (
            <form onSubmit={handleSubmitPayment} className="space-y-5" noValidate>
              {/* Compact Order Breakdown */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Resumen multi-tienda</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Cifrado TLS simulado
                  </span>
                </div>
                <div className="mt-2.5 space-y-1.5 text-xs">
                  {plan.steps.map((step) => (
                    <div
                      key={step.store}
                      className="flex items-center justify-between text-slate-600 dark:text-slate-400"
                    >
                      <div className="flex items-center gap-2">
                        <StoreBadge store={step.store} size="sm" />
                        <span>{step.items.length} línea(s)</span>
                      </div>
                      <span className="tabular-price font-mono font-semibold text-slate-900 dark:text-slate-200">
                        {formatCurrency(step.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Método de pago
                  </span>
                  <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                  >
                    Autocompletar datos de prueba
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'card', label: 'Tarjeta', icon: CreditCard },
                      { id: 'paypal', label: 'PayPal', icon: Wallet },
                      { id: 'transfer', label: 'Transferencia', icon: Building2 },
                    ] as { id: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[]
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = method === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`payment-method-${item.id}`}
                        onClick={() => {
                          setMethod(item.id);
                          setValidationErrors({});
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method-Specific Form */}
              {method === 'card' && (
                <div className="space-y-4">
                  {/* Interactive Live Card Preview */}
                  <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 text-white shadow-md dark:border dark:border-slate-700">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>UniShop Pay</span>
                      <span className="font-mono font-bold tracking-wider">{cardBrand}</span>
                    </div>
                    <p className="mt-5 font-mono text-lg tracking-[0.18em] text-white">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                    <div className="mt-5 flex items-end justify-between text-xs">
                      <div>
                        <span className="block text-[10px] text-slate-400">Titular</span>
                        <span className="font-medium uppercase tracking-wide">
                          {cardHolder || 'NOMBRE DEL TITULAR'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400">Caducidad</span>
                        <span className="font-mono">{expiry || 'MM/AA'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="card-holder-input"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Nombre del titular
                      </label>
                      <input
                        id="card-holder-input"
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Carlos Martínez"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      {validationErrors.cardHolder && (
                        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                          {validationErrors.cardHolder}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="card-number-input"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Número de tarjeta
                      </label>
                      <input
                        id="card-number-input"
                        type="text"
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="4242 4242 4242 4242"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      {validationErrors.cardNumber && (
                        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                          {validationErrors.cardNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="card-expiry-input"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Caducidad (MM/AA)
                      </label>
                      <input
                        id="card-expiry-input"
                        type="text"
                        inputMode="numeric"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
                        placeholder="08/29"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      {validationErrors.expiry && (
                        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                          {validationErrors.expiry}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="card-cvv-input"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        CVV
                      </label>
                      <input
                        id="card-cvv-input"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="842"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      {validationErrors.cvv && (
                        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                          {validationErrors.cvv}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {method === 'paypal' && (
                <div>
                  <label
                    htmlFor="paypal-email-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Correo de tu cuenta PayPal / Wallet Digital
                  </label>
                  <input
                    id="paypal-email-input"
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="carlos.m@correo.es"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {validationErrors.paypalEmail && (
                    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                      {validationErrors.paypalEmail}
                    </p>
                  )}
                </div>
              )}

              {method === 'transfer' && (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="transfer-holder-input"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Nombre del ordenante
                    </label>
                    <input
                      id="transfer-holder-input"
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Carlos Martínez"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    {validationErrors.cardHolder && (
                      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                        {validationErrors.cardHolder}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="transfer-iban-input"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      IBAN de cargo (Transferencia SEPA inmediata)
                    </label>
                    <input
                      id="transfer-iban-input"
                      type="text"
                      value={iban}
                      onChange={(e) => setIban(e.target.value.toUpperCase())}
                      placeholder="ES91 2100 0418 4502 0005 1332"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    {validationErrors.iban && (
                      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                        {validationErrors.iban}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Simulated Rejection Switch for Testing */}
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-950/60 cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Simular error de tarjeta / rechazo bancario
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Útil para comprobar la gestión de pagos denegados en la interfaz
                  </p>
                </div>
                <input
                  type="checkbox"
                  data-testid="simulate-payment-error-toggle"
                  checked={simulateError}
                  onChange={(e) => setSimulateError(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <button
                type="submit"
                data-testid="confirm-gateway-payment-btn"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                Pagar {formatCurrency(plan.grandTotal)} de forma segura
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
