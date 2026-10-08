import '@/lib/opencals';
import { CheckoutService, type SubmitCheckout } from '@opencals/storefront-sdk';
import { getAccessToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';
import { toCheckoutCustomer } from '../customer-payload';

/**
 * POST { stripePaymentIntentId?, appointmentsSettings?, trackingData?, customer?, deliveryAddress? }
 * → CheckoutResponse ({ order, customer, auth? }).
 */
export async function POST(request: NextRequest) {
	const cartId = request.headers.get('X-Cart-Id') ?? '';

	try {
		const raw = (await request.json()) as Record<string, unknown>;
		const customer = toCheckoutCustomer(raw.customer, raw.deliveryAddress);
		const body: SubmitCheckout = {
			...(typeof raw.stripePaymentIntentId === 'string' ? { stripePaymentIntentId: raw.stripePaymentIntentId } : {}),
			...(raw.appointmentsSettings && typeof raw.appointmentsSettings === 'object'
				? { appointmentsSettings: raw.appointmentsSettings as SubmitCheckout['appointmentsSettings'] }
				: {}),
			...(raw.trackingData && typeof raw.trackingData === 'object'
				? { trackingData: raw.trackingData as SubmitCheckout['trackingData'] }
				: {}),
			// Cast: `customer.deliveryAddress` is accepted by the API but missing from SDK 0.3.14 types.
			...(customer ? { customer: customer as SubmitCheckout['customer'] } : {}),
		};
		const token = await getAccessToken();
		const { data } = await CheckoutService.submit({
			body,
			headers: { Authorization: `Bearer ${token ?? ''}`, 'X-Cart-Id': cartId },
			throwOnError: true,
		});
		return NextResponse.json(data);
	} catch (err) {
		return handleApiError(err, 'Checkout failed');
	}
}
