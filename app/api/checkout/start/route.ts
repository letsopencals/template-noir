import '@/lib/opencals';
import { CheckoutService, type StartCheckout } from '@opencals/storefront-sdk';
import { getAccessToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';
import { toCheckoutCustomer } from '../customer-payload';

const PROVIDERS = ['stripe', 'cash', 'bank_transfer', 'shopify', 'no_payment_required'] as const;

/**
 * POST { provider, customer?, deliveryAddress? } → CheckoutStartResponse.
 * `deliveryAddress` is nested into `customer.deliveryAddress` (the backend
 * links it to every delivery-location appointment in the cart).
 */
export async function POST(request: NextRequest) {
	const cartId = request.headers.get('X-Cart-Id') ?? '';

	try {
		const raw = (await request.json()) as Record<string, unknown>;
		const provider = PROVIDERS.find((p) => p === raw.provider);
		if (!provider) {
			return NextResponse.json({ error: 'Unknown payment provider' }, { status: 400 });
		}
		const customer = toCheckoutCustomer(raw.customer, raw.deliveryAddress);
		const token = await getAccessToken();
		const { data } = await CheckoutService.start({
			// Cast: `customer.deliveryAddress` is accepted by the API but missing from SDK 0.3.14 types.
			body: { provider, ...(customer ? { customer } : {}) } as StartCheckout,
			headers: { Authorization: `Bearer ${token ?? ''}`, 'X-Cart-Id': cartId },
			throwOnError: true,
		});
		return NextResponse.json(data);
	} catch (err) {
		return handleApiError(err, 'Could not start checkout');
	}
}
