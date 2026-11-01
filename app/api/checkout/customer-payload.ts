import type { Address, ExistingOrderCustomer, NewOrderCustomer } from '@opencals/storefront-sdk';

/** The checkout customer: the SDK union, with the delivery address nested on it. */
export type CheckoutCustomer = ExistingOrderCustomer | NewOrderCustomer;

const ADDRESS_KEYS = [
	'firstName',
	'lastName',
	'addressLine1',
	'addressLine2',
	'city',
	'state',
	'postalCode',
	'country',
	'phone',
	'email',
] as const satisfies ReadonlyArray<keyof Address>;

function str(v: unknown): string | undefined {
	return typeof v === 'string' && v.trim() ? v.trim().slice(0, 255) : undefined;
}

function sanitizeAddress(input: unknown): Address | null {
	if (!input || typeof input !== 'object') return null;
	const src = input as Record<string, unknown>;
	const out: Address = {};
	for (const key of ADDRESS_KEYS) {
		const v = str(src[key]);
		if (v) out[key] = v;
	}
	if (out.country) out.country = out.country.toUpperCase();
	return out.addressLine1 || out.city ? out : null;
}

/**
 * Normalises the template's client payload into the SDK customer union:
 *   { kind: 'existing', customerId, phone? } | { kind: 'new', email, firstName?, lastName?, phone? }
 * plus an optional top-level `deliveryAddress`, which is nested into the customer.
 * Returns undefined when there's nothing to send (the cart already has its customer).
 */
export function toCheckoutCustomer(customer: unknown, deliveryAddress: unknown): CheckoutCustomer | undefined {
	const address = sanitizeAddress(deliveryAddress);
	const c = (customer && typeof customer === 'object' ? customer : null) as Record<string, unknown> | null;
	if (!c) return undefined;

	const phone = str(c.phone);
	const extra = { ...(phone ? { phone } : {}), ...(address ? { deliveryAddress: address } : {}) };

	const customerId = str(c.customerId);
	if (customerId) {
		return {
			kind: 'existing',
			customerId,
			...(str(c.firstName) ? { firstName: str(c.firstName) } : {}),
			...(str(c.lastName) ? { lastName: str(c.lastName) } : {}),
			...extra,
		};
	}
	const email = str(c.email);
	if (!email) return undefined;
	return {
		kind: 'new',
		externalId: str(c.externalId) ?? email,
		email,
		...(str(c.firstName) ? { firstName: str(c.firstName) } : {}),
		...(str(c.lastName) ? { lastName: str(c.lastName) } : {}),
		...extra,
	};
}
