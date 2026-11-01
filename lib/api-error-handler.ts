import { OpencalsApiError, type CheckoutErrorResponse } from '@opencals/storefront-sdk';
import { NextResponse } from 'next/server';

/** A non-empty string, or undefined. */
function text(value: unknown): string | undefined {
	return typeof value === 'string' && value ? value : undefined;
}

/**
 * Turns an SDK error into `{ error, errors?, code?, orderId?, paymentStatus? }` with the API's status, so the
 * client can react to checkout conflicts (CART_ALREADY_CHECKED_OUT, CART_EXPIRED, CHECKOUT_IN_PROGRESS) and
 * 402 PAYMENT_NOT_AUTHORIZED.
 */
export function handleApiError(err: unknown, fallbackMessage = 'Internal server error') {
	if (err instanceof OpencalsApiError) {
		const fieldErrors = err.toFieldErrors();
		// The checkout error fields of the parsed body. Other errors (a plain validation 400) carry none of them.
		const body: Partial<CheckoutErrorResponse> = err.body ?? {};
		const orderId = text(body.orderId);
		const paymentStatus = text(body.paymentStatus);
		return NextResponse.json(
			{
				error: err.message,
				...(Object.keys(fieldErrors).length > 0 && { errors: fieldErrors }),
				// Any route's code is passed on (checkout codes, discount codes, …), so this stays a string.
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
