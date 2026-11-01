'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import type { CheckoutResponse, CheckoutStartResponse, CustomerProviderCatalogItem } from '@opencals/storefront-sdk';
import { useCart } from '@/contexts/cart-context';
import { checkoutModeOf, readCheckoutError, rememberPaymentInstructions, type CheckoutError } from '@/lib/checkout-payment';

interface CheckoutPaymentInput {
	providers: CustomerProviderCatalogItem[];
	/** JSON + X-Cart-Id headers for the held cart. */
	cartHeaders: () => Record<string, string>;
	/** `{ customer, deliveryAddress? }` sent with start and submit. */
	checkoutCustomer: object;
	/** False while there is no valid hold to pay for. */
	enabled: boolean;
	setError: (message: string | null) => void;
	/** The hold is gone (409 CART_EXPIRED): the guest has to pick new dates. */
	onHoldLost?: () => void;
}

class CheckoutFailure extends Error {
	constructor(readonly detail: CheckoutError) {
		super(detail.message);
	}
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** POSTs, waiting out 409 CHECKOUT_IN_PROGRESS (a double click or a second tab) a few times. */
async function post(url: string, headers: Record<string, string>, body: object): Promise<Response> {
	for (let attempt = 0; ; attempt++) {
		const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
		if (res.status !== 409 || attempt >= 3) return res;
		const peek = (await res
			.clone()
			.json()
			.catch(() => null)) as { code?: string } | null;
		if (peek?.code !== 'CHECKOUT_IN_PROGRESS') return res;
		await sleep(1500 * (attempt + 1));
	}
}

/**
 * Payment for a held cart, shared by `/book` and `/booking/[slug]`.
 *
 * Routes on the provider's `checkoutMode`: `internal` starts checkout so the
 * card form can mount, `redirect` follows the provider's URL, and `manual`
 * (cash, bank transfer, invoice) or `none` only select; `confirmManual()` then
 * starts and submits in one go. A start that comes back as
 * `no_payment_required` submits straight away. Submit stores any payment
 * instructions for `/thank-you`.
 */
export function useCheckoutPayment({ providers, cartHeaders, checkoutCustomer, enabled, setError, onHoldLost }: CheckoutPaymentInput) {
	const router = useRouter();
	const { clearCart } = useCart();
	const [provider, setProvider] = useState<string | null>(null);
	const [paymentData, setPaymentData] = useState<CheckoutStartResponse | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const reset = useCallback(() => {
		setProvider(null);
		setPaymentData(null);
	}, []);

	const goToOrder = useCallback(
		(orderId: string) => {
			clearCart();
			router.push(`/thank-you?orderId=${encodeURIComponent(orderId)}`);
		},
		[clearCart, router],
	);

	/** Shows the right message for a failed start/submit. Returns true when it navigated away. */
	const handleFailure = useCallback(
		(err: unknown, during: 'start' | 'submit', fallback: string): boolean => {
			const detail = err instanceof CheckoutFailure ? err.detail : null;
			if (detail?.code === 'CART_ALREADY_CHECKED_OUT' && detail.orderId) {
				goToOrder(detail.orderId);
				return true;
			}
			if (detail?.code === 'CART_EXPIRED') {
				reset();
				setError('Your hold ran out and those dates were taken in the meantime. Pick new dates to book again.');
				onHoldLost?.();
				return false;
			}
			if (detail?.code === 'CHECKOUT_IN_PROGRESS') {
				setError('We are still processing this booking. Wait a few seconds, then try again.');
				return false;
			}
			if (detail?.code === 'PAYMENT_NOT_AUTHORIZED' || detail?.status === 402) {
				// Keep the card form: the guest confirms again or uses another card.
				setError('Your card was not authorised and nothing was charged. Try again, or use another card.');
				return false;
			}
			setError(err instanceof Error && err.message ? err.message : fallback);
			if (during === 'start') reset();
			return false;
		},
		[goToOrder, reset, setError, onHoldLost],
	);

	const start = useCallback(
		async (providerName: string): Promise<CheckoutStartResponse> => {
			const res = await post('/api/checkout/start', cartHeaders(), { provider: providerName, ...checkoutCustomer });
			if (!res.ok) throw new CheckoutFailure(await readCheckoutError(res, 'Could not start checkout'));
			const data = (await res.json().catch(() => null)) as CheckoutStartResponse | null;
			if (!data) throw new Error('Could not start checkout');
			return data;
		},
		[cartHeaders, checkoutCustomer],
	);

	/** Places the order. Throws; callers handle the failure. */
	const placeOrder = useCallback(
		async (stripePaymentIntentId?: string) => {
			const res = await post('/api/checkout/submit', cartHeaders(), {
				appointmentsSettings: { markAsScheduled: true },
				...checkoutCustomer,
				...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
			});
			if (!res.ok) throw new CheckoutFailure(await readCheckoutError(res, 'Checkout failed'));
			const data = (await res.json().catch(() => null)) as CheckoutResponse | null;
			const orderId = data?.order?.id;
			if (!orderId) throw new Error('We could not confirm the booking. Check your email before trying again, or message the concierge.');
			rememberPaymentInstructions(orderId, data.paymentInstructions);
			if (data.auth?.accessToken) {
				await signIn('checkout-token', {
					accessToken: data.auth.accessToken,
					refreshToken: data.auth.refreshToken,
					redirect: false,
				});
			}
			goToOrder(orderId);
		},
		[cartHeaders, checkoutCustomer, goToOrder],
	);

	/** Card payments: called with the PaymentIntent once Stripe has confirmed it. */
	const submit = useCallback(
		async (stripePaymentIntentId?: string) => {
			setSubmitting(true);
			setError(null);
			try {
				await placeOrder(stripePaymentIntentId);
			} catch (err) {
				handleFailure(err, 'submit', 'Checkout failed');
			} finally {
				setSubmitting(false);
			}
		},
		[placeOrder, handleFailure, setError],
	);

	const selectProvider = useCallback(
		async (providerName: string) => {
			if (!enabled) return;
			const mode = checkoutModeOf(providers.find((p) => p.name === providerName) ?? { name: providerName });
			setProvider(providerName);
			setPaymentData(null);
			setError(null);
			// Pay later / nothing to pay: the guest confirms with confirmManual().
			if (mode === 'manual' || mode === 'none') return;
			setSubmitting(true);
			try {
				const data = await start(providerName);
				if ((data.provider as string) === 'no_payment_required') {
					await placeOrder();
					return;
				}
				if (data.redirectUrl) {
					window.location.href = data.redirectUrl;
					return;
				}
				if (!data.clientSecret) throw new Error('This payment method is not available online. Choose another one.');
				setPaymentData(data);
			} catch (err) {
				handleFailure(err, 'start', 'Could not start checkout');
			} finally {
				setSubmitting(false);
			}
		},
		[enabled, providers, start, placeOrder, handleFailure, setError],
	);

	/** Manual or no-payment methods: start and submit together. */
	const confirmManual = useCallback(async () => {
		if (!enabled || !provider) return;
		setSubmitting(true);
		setError(null);
		try {
			const data = await start(provider);
			if (data.redirectUrl) {
				window.location.href = data.redirectUrl;
				return;
			}
			await placeOrder();
		} catch (err) {
			handleFailure(err, 'submit', 'Could not confirm the booking');
		} finally {
			setSubmitting(false);
		}
	}, [enabled, provider, start, placeOrder, handleFailure, setError]);

	return { provider, paymentData, submitting, selectProvider, confirmManual, submit, reset };
}
