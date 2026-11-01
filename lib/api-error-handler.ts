import { OpencalsApiError } from '@opencals/storefront-sdk';
import { NextResponse } from 'next/server';

/** A string field from the API's parsed error body (`OpencalsApiError.body`, SDK 0.4+). */
function errorField(err: OpencalsApiError, key: 'orderId' | 'paymentStatus'): string | undefined {
	const value = (err as { body?: Record<string, unknown> | null }).body?.[key];
	return typeof value === 'string' ? value : undefined;
}

/**
 * Turns an SDK error into `{ error, errors?, code?, orderId?, paymentStatus? }` with the API's status, so the
 * client can react to checkout conflicts (CART_ALREADY_CHECKED_OUT, CART_EXPIRED, CHECKOUT_IN_PROGRESS) and
 * 402 PAYMENT_NOT_AUTHORIZED.
 */
export function handleApiError(err: unknown, fallbackMessage = 'Internal server error') {
	if (err instanceof OpencalsApiError) {
		const fieldErrors = err.toFieldErrors();
		const orderId = errorField(err, 'orderId');
		const paymentStatus = errorField(err, 'paymentStatus');
		return NextResponse.json(
			{
				error: err.message,
				...(Object.keys(fieldErrors).length > 0 && { errors: fieldErrors }),
				...(err.code ? { code: err.code } : {}),
				...(orderId ? { orderId } : {}),
				...(paymentStatus ? { paymentStatus } : {}),
			},
			{ status: err.status },
		);
	}

	console.error(fallbackMessage, err);
	return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
