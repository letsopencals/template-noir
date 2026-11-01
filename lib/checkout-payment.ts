import type {
	CheckoutErrorCode,
	CheckoutErrorResponse,
	CustomerProviderCatalogItem,
	PaymentInstructions,
	PaymentProviderName,
} from '@opencals/storefront-sdk';

/**
 * Client helpers for checkout: how a payment method is paid, its label, the
 * error shape of `/api/checkout/*`, and the payment instructions handed from
 * checkout to `/thank-you`.
 */

export type CheckoutMode = CustomerProviderCatalogItem['checkoutMode'];
const MANUAL = new Set<PaymentProviderName>(['cash', 'bank_transfer', 'stripe_invoice']);

/** The catalog's checkoutMode, with a fallback for responses that predate it. */
export function checkoutModeOf(
	provider: Pick<CustomerProviderCatalogItem, 'name'> & Partial<Pick<CustomerProviderCatalogItem, 'checkoutMode'>> | undefined | null,
): CheckoutMode {
	if (provider?.checkoutMode) return provider.checkoutMode;
	const name = provider?.name;
	if (name === 'no_payment_required') return 'none';
	if (name && MANUAL.has(name)) return 'manual';
	return 'internal';
}

/** "bank_transfer" → "Bank transfer", for providers without a display name. */
export function providerLabel(provider: Pick<CustomerProviderCatalogItem, 'name'> & Partial<Pick<CustomerProviderCatalogItem, 'displayName'>>): string {
	if (provider.displayName?.trim()) return provider.displayName;
	const words = String(provider.name).replace(/[_-]+/g, ' ').trim();
	return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Payment';
}

export interface CheckoutError extends Pick<Partial<CheckoutErrorResponse>, 'code' | 'orderId' | 'paymentStatus'> {
	status: number;
	message: string;
	errors?: Record<string, string[]>;
}

/** Reads `{ error, code, orderId, paymentStatus, errors }` from a failed `/api/checkout/*` response. */
export async function readCheckoutError(res: Response, fallback: string): Promise<CheckoutError> {
	const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
	const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
	return {
		status: res.status,
		message: str(data?.error) ?? fallback,
		// A plain validation 400 has no code; anything else from /api/checkout/* is a checkout code.
		code: str(data?.code) as CheckoutErrorCode | undefined,
		orderId: str(data?.orderId),
		paymentStatus: str(data?.paymentStatus),
		errors: data?.errors && typeof data.errors === 'object' ? (data.errors as Record<string, string[]>) : undefined,
	};
}

/* ------------------------------------------------------ payment instructions */

const KEY = (orderId: string) => `noir:payment-instructions:${orderId}`;

/** Keeps the submit response's payment instructions for the thank-you page (this tab only). */
export function rememberPaymentInstructions(orderId: string, instructions: PaymentInstructions | null | undefined) {
	if (!orderId || !instructions) return;
	try {
		sessionStorage.setItem(KEY(orderId), JSON.stringify(instructions));
	} catch {
		// Storage blocked: the thank-you page falls back to "check your email".
	}
}

export function recallPaymentInstructions(orderId: string): PaymentInstructions | null {
	if (!orderId) return null;
	try {
		const raw = sessionStorage.getItem(KEY(orderId));
		const parsed = raw ? (JSON.parse(raw) as PaymentInstructions) : null;
		return parsed && typeof parsed === 'object' && typeof parsed.provider === 'string' ? parsed : null;
	} catch {
		return null;
	}
}
