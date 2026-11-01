import type { OpencalsApiError } from '@opencals/storefront-sdk';

/** The API's field errors as the routes pass them on (`fieldErrors` in the error JSON). */
export type ApiFieldErrors = NonNullable<OpencalsApiError['errors']>;

/** Messages per form field, keyed by the form's own field names. */
export type FieldErrors = Record<string, string[]>;

/** Shown under every phone input, and as the error when the number has no country code. */
export const PHONE_HINT = 'Include your country code, e.g. +971 50 123 4567';
export const PHONE_PLACEHOLDER = '+971 50 123 4567';

/** Client-side check before submitting; the API stays the source of truth. */
export function phoneError(phone: string): string | null {
	const value = phone.trim();
	return value && !value.startsWith('+') ? PHONE_HINT : null;
}

/** Customer-level containers whose fields map by their last segment (`customer.phone` → `phone`). */
const CUSTOMER_PARENTS = new Set(['', 'customer']);

/**
 * Maps the API's `errors` array onto form fields by the end of each `property` path.
 *
 * `fields` maps a path suffix to the form's field key. Two-segment suffixes
 * (`deliveryAddress.city`, `address.addressLine1`) are tried first; a single
 * segment (`phone`, `email`, …) only matches a top-level field or one on
 * `customer`, so `customer.billingAddress.phone` never lands on the guest's
 * own phone input. Whatever doesn't match comes back in `unmapped`.
 */
export function mapFieldErrors(
	errors: ApiFieldErrors | null | undefined,
	fields: Record<string, string>,
): { mapped: FieldErrors; unmapped: string[] } {
	const mapped: FieldErrors = {};
	const unmapped: string[] = [];
	for (const { property, messages } of errors ?? []) {
		const parts = property.split('.');
		const last = parts[parts.length - 1] ?? '';
		const parent = parts.length > 1 ? parts[parts.length - 2]! : '';
		const key = fields[`${parent}.${last}`] ?? (CUSTOMER_PARENTS.has(parts.slice(0, -1).join('.')) ? fields[last] : undefined);
		if (key) mapped[key] = [...(mapped[key] ?? []), ...messages];
		else unmapped.push(...messages);
	}
	return { mapped, unmapped };
}

/** The `fieldErrors` array of a parsed error body, when it has one. */
export function readFieldErrors(data: unknown): ApiFieldErrors | undefined {
	const value = data && typeof data === 'object' ? (data as { fieldErrors?: unknown }).fieldErrors : undefined;
	return Array.isArray(value) ? (value as ApiFieldErrors) : undefined;
}
