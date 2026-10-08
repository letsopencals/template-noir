import type { ExistingOrderCustomer, NewOrderCustomer } from '@opencals/storefront-sdk';

/**
 * Delivery address on the checkout customer. The backend (`AddressDto`) accepts
 * it on start/submit, but the pinned SDK 0.3.14 types predate the field, hence
 * the widened type and the cast at the call site.
 */
export interface DeliveryAddressInput {
	firstName?: string;
	lastName?: string;
	addressLine1?: string;
	addressLine2?: string;
	city?: string;
	state?: string;
	postalCode?: string;
	/** ISO 3166-1 alpha-2, uppercase. */
	country?: string;
	phone?: string;
	email?: string;
}

export type CheckoutCustomer = (ExistingOrderCustomer | NewOrderCustomer) & {
	deliveryAddress?: DeliveryAddressInput;
};

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
] as const;

function str(v: unknown): string | undefined {
	return typeof v === 'string' && v.trim() ? v.trim().slice(0, 255) : undefined;
}

function sanitizeAddress(input: unknown): DeliveryAddressInput | null {
	if (!input || typeof input !== 'object') return null;
	const src = input as Record<string, unknown>;
	const out: DeliveryAddressInput = {};
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
			customerId,
			...(str(c.firstName) ? { firstName: str(c.firstName) } : {}),
			...(str(c.lastName) ? { lastName: str(c.lastName) } : {}),
			...extra,
		};
	}
	const email = str(c.email);
	if (!email) return undefined;
	return {
		externalId: str(c.externalId) ?? email,
		email,
		...(str(c.firstName) ? { firstName: str(c.firstName) } : {}),
		...(str(c.lastName) ? { lastName: str(c.lastName) } : {}),
		...extra,
	};
}
