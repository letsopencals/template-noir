import { OpencalsApiError, type CheckoutErrorResponse } from '@opencals/storefront-sdk';
import { NextResponse } from 'next/server';

/** A non-empty string, or undefined. */
function text(value: unknown): string | undefined {
	return typeof value === 'string' && value ? value : undefined;
}

/**
 * Turns an SDK error into `{ error, errors?, fieldErrors?, code?, orderId?, paymentStatus? }` with the API's
 * status, so the client can react to checkout conflicts (CART_ALREADY_CHECKED_OUT, CART_EXPIRED,
 * CHECKOUT_IN_PROGRESS) and 402 PAYMENT_NOT_AUTHORIZED. `fieldErrors` is the API's validation array as is
 * (`[{ property: 'customer.phone', messages }]`), so forms can show each message under its field.
 */
export function handleApiError(err: unknown, fallbackMessage = 'Internal server error') {
	if (err instanceof OpencalsApiError) {
		const fieldErrors = err.toFieldErrors();
		const apiFieldErrors: NonNullable<OpencalsApiError['errors']> = err.errors ?? [];
		// The checkout error fields of the parsed body. Other errors (a plain validation 400) carry none of them.
		const body: Partial<CheckoutErrorResponse> = err.body ?? {};
		const orderId = text(body.orderId);
		const paymentStatus = text(body.paymentStatus);
		return NextResponse.json(
			{
				error: err.message,
				...(Object.keys(fieldErrors).length > 0 && { errors: fieldErrors }),
				...(apiFieldErrors.length > 0 && { fieldErrors: apiFieldErrors }),
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
