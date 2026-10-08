import moment from 'moment-timezone';
import { siteConfig } from '@/lib/site-config';

/**
 * Turns an appointment (list, detail or order-embedded) into the facts the
 * account pages show. NOIR has two kinds of booking over one store:
 *
 * - **Rental**: a car product with a 1-day base duration (86400 s) and no
 *   staff. The slot runs pick-up date 00:00 → return date 00:00 in the store
 *   timezone, so it is shown as dates + a day count, never as clock times. The
 *   handover window, return time, flight number and a separate collection
 *   address travel as appointment `customAttributes`.
 * - **Chauffeur**: a product with a driver (staff) and a clock-time slot. The
 *   preferred car is a custom attribute.
 *
 * Anything else (e.g. a merchant-created booking) falls back to "other".
 */

export type BookingKind = 'rental' | 'chauffeur' | 'other';

interface AddressFields {
	addressLine1?: string | null;
	addressLine2?: string | null;
	city?: string | null;
	state?: string | null;
	postalCode?: string | null;
	country?: string | null;
	displayAddress?: string | null;
}

/** Structural subset shared by the SDK's appointment list, detail and order shapes. */
export interface AppointmentLike extends AddressFields {
	from: string;
	to: string;
	staffMemberId?: string | null;
	staffMember?: { firstName?: string | null; lastName?: string | null } | null;
	customAttributes?: Record<string, string> | null;
	product?: { title?: string | null; slug?: string | null; duration?: number | null } | null;
	location?: (AddressFields & { title?: string | null; type?: string | null; address?: string | null }) | null;
}

export interface BookingMeta {
	kind: BookingKind;
	title: string;
	/** Rentals: local pick-up / return dates (YYYY-MM-DD, store timezone). */
	pickUpDate: string;
	returnDate: string;
	/** Rentals: billed days (ceil of the slot length in days, min 1). */
	days: number;
	handoverTime: string | null;
	returnTime: string | null;
	flightNumber: string | null;
	/** Rentals: collection address when it differs from the delivery address. */
	collectAddress: string | null;
	/** Chauffeur: preferred car, as stored by the booking flow (slug or title). */
	preferredCar: string | null;
	driver: string | null;
	/** True when the booking's location is a DELIVERY location. */
	isDelivery: boolean;
	/** Delivery: the customer's address. Otherwise the location's address. */
	address: string | null;
	locationTitle: string | null;
	/** Where "Book again" should go. */
	bookAgainHref: string | null;
}

const DAY_SECONDS = 86_400;
const DAY_MS = DAY_SECONDS * 1000;
const DATE = 'YYYY-MM-DD';
const KEYS = siteConfig.customAttributeKeys;

function joinAddress(a: AddressFields | null | undefined): string | null {
	if (!a) return null;
	if (a.displayAddress) return a.displayAddress;
	const parts = [a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode].filter(Boolean);
	return parts.length ? parts.join(', ') : null;
}

function attr(attrs: Record<string, string> | null | undefined, key: string): string | null {
	const v = attrs?.[key];
	return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/** "rolls-royce-cullinan" → "Rolls Royce Cullinan"; anything else is returned as-is. */
export function prettifyCar(value: string): string {
	if (!/^[a-z0-9]+(-[a-z0-9]+)+$/.test(value)) return value;
	return value
		.split('-')
		.map((w) => (/^\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
		.join(' ');
}

export function isRentalProduct(product: AppointmentLike['product'], staffMemberId?: string | null): boolean {
	return (product?.duration ?? 0) >= DAY_SECONDS && !staffMemberId;
}

export function getBookingMeta(appt: AppointmentLike, tz: string = siteConfig.timezone): BookingMeta {
	const attrs = appt.customAttributes;
	const staffName = appt.staffMember
		? [appt.staffMember.firstName, appt.staffMember.lastName].filter(Boolean).join(' ') || null
		: null;
	const preferredCar = attr(attrs, KEYS.preferredCar);

	const rental = isRentalProduct(appt.product, appt.staffMemberId ?? (staffName ? 'staff' : null));
	const kind: BookingKind = rental ? 'rental' : staffName || preferredCar ? 'chauffeur' : 'other';

	const start = moment.utc(appt.from).tz(tz);
	const end = moment.utc(appt.to).tz(tz);
	const lengthMs = end.valueOf() - start.valueOf();

	const isDelivery = appt.location?.type === siteConfig.locationTypes.delivery;
	const address = isDelivery
		? joinAddress(appt) ?? null
		: joinAddress(appt.location) ?? appt.location?.address ?? null;

	const slug = appt.product?.slug ?? null;
	const bookAgainHref = slug
		? kind === 'rental'
			? `/book?car=${encodeURIComponent(slug)}`
			: `/booking/${encodeURIComponent(slug)}`
		: null;

	return {
		kind,
		title: appt.product?.title ?? (kind === 'rental' ? 'Rental' : 'Booking'),
		pickUpDate: start.format(DATE),
		returnDate: end.format(DATE),
		days: Math.max(1, Math.ceil(lengthMs / DAY_MS - 1e-9)),
		handoverTime: attr(attrs, KEYS.handoverTime),
		returnTime: attr(attrs, KEYS.returnTime),
		flightNumber: attr(attrs, KEYS.flightNumber),
		collectAddress: attr(attrs, KEYS.collectAddress),
		preferredCar: preferredCar ? prettifyCar(preferredCar) : null,
		driver: staffName,
		isDelivery,
		address,
		locationTitle: appt.location?.title ?? null,
		bookAgainHref,
	};
}

/** Formats a local YYYY-MM-DD date (no timezone shift). */
export function formatLocalDate(date: string, format = 'ddd D MMM YYYY'): string {
	return moment.utc(date, DATE, true).format(format);
}

export function dayLabel(days: number): string {
	return `${days} ${days === 1 ? 'day' : 'days'}`;
}
