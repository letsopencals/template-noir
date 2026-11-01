import '@/lib/opencals';
import { CheckoutService, type StartCheckout } from '@opencals/storefront-sdk';
import { getAccessToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';
import { toCheckoutCustomer } from '../customer-payload';

/** Provider ids are short snake_case names (stripe, cash, bank_transfer, stripe_invoice, …). */
const PROVIDER_NAME = /^[a-z][a-z0-9_]{0,63}$/;

/**
 * POST { provider, customer?, deliveryAddress? } → CheckoutStartResponse.
 * `deliveryAddress` is nested into `customer.deliveryAddress` (the backend
 * links it to every delivery-location appointment in the cart).
 */
export async function POST(request: NextRequest) {
	const cartId = request.headers.get('X-Cart-Id') ?? '';

	try {
		const raw = (await request.json()) as Record<string, unknown>;
		// Any provider the store offers goes through; the API rejects ones it doesn't have.
		if (typeof raw.provider !== 'string' || !PROVIDER_NAME.test(raw.provider)) {
			return NextResponse.json({ error: 'Choose a payment method' }, { status: 400 });
		}
		const provider = raw.provider as StartCheckout['provider'];
		const customer = toCheckoutCustomer(raw.customer, raw.deliveryAddress);
		const token = await getAccessToken();
		const { data } = await CheckoutService.start({
			body: { provider, ...(customer ? { customer } : {}) },
			headers: { Authorization: `Bearer ${token ?? ''}`, 'X-Cart-Id': cartId },
			throwOnError: true,
		});
		return NextResponse.json(data);
	} catch (err) {
		return handleApiError(err, 'Could not start checkout');
	}
}
