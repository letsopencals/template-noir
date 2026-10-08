import type { OrderDetailAppointment } from '@opencals/storefront-sdk';
import { fleetContent, siteConfig } from '@/lib/site-config';
import { localMidnight } from '@/lib/rental';
import { getProductImage } from '@/lib/format';

/** Display model for one confirmed appointment on /thank-you (rental or chauffeur). */
export interface ConfirmedBooking {
	id: string;
	kind: 'rental' | 'chauffeur';
	title: string;
	image: string | null;
	/** Rentals: true when the car comes to the guest; chauffeur: pick-up from an address. */
	delivered: boolean;
	/** UTC ISO instants of the slot. */
	from: string;
	to: string;
	/** Local (store tz) YYYY-MM-DD of the slot start / end. */
	fromDate: string;
	toDate: string;
	handoverWindow: string | null;
	returnWindow: string | null;
	/** Where the car or chauffeur meets the guest (delivery) or null for the garage. */
	address: string | null;
	/** Rental collection address when it differs from the delivery address. */
	collectAddress: string | null;
	flightNumber: string | null;
	preferredCar: string | null;
	chauffeur: string | null;
	depositAed: number | null;
	status: string;
}

const TZ = siteConfig.timezone;
const KEYS = siteConfig.customAttributeKeys;
const LOCAL_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });

function localDate(iso: string): string {
	return LOCAL_DATE.format(new Date(iso));
}

function joinAddress(a: OrderDetailAppointment): string | null {
	const parts = [a.addressLine1, a.addressLine2, a.state, a.city].map((p) => p?.trim()).filter(Boolean);
	return parts.length > 0 ? parts.join(', ') : null;
}

export function toConfirmedBooking(a: OrderDetailAppointment): ConfirmedBooking {
	const slug = a.product?.slug ?? '';
	const content = fleetContent[slug];
	const attrs = (a.customAttributes ?? {}) as Record<string, string>;
	const delivered = a.location?.type === siteConfig.locationTypes.delivery;
	const preferredSlug = attrs[KEYS.preferredCar] ?? null;
	const staff = a.staffMember ? [a.staffMember.firstName, a.staffMember.lastName].filter(Boolean).join(' ') : '';

	return {
		id: a.id,
		kind: content ? 'rental' : 'chauffeur',
		title: a.product?.title ?? 'Booking',
		image: getProductImage(a.product),
		delivered,
		from: a.from,
		to: a.to,
		fromDate: localDate(a.from),
		// Rentals end at local midnight of the return day, so this is the return date.
		toDate: localDate(a.to),
		handoverWindow: attrs[KEYS.handoverTime] ?? null,
		returnWindow: attrs[KEYS.returnTime] ?? null,
		address: delivered ? (joinAddress(a) ?? a.displayAddress ?? null) : null,
		collectAddress: attrs[KEYS.collectAddress] ?? null,
		flightNumber: attrs[KEYS.flightNumber] ?? null,
		preferredCar: preferredSlug ? titleFromSlug(preferredSlug) : null,
		chauffeur: staff || null,
		depositAed: content?.depositAed ?? null,
		status: (a.status ?? '').toLowerCase(),
	};
}

function titleFromSlug(slug: string): string {
	return slug
		.split('-')
		.map((w) => (/\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
		.join(' ');
}

/** "10:00–12:00" on a local date → [startMs, endMs] UTC. Null when the window can't be parsed. */
export function windowInstants(date: string, window: string | null): [number, number] | null {
	const m = window?.match(/^(\d{2}):(\d{2})\D+(\d{2}):(\d{2})$/);
	if (!m) return null;
	const midnight = localMidnight(date, TZ);
	const at = (h: string, mi: string) => midnight + (Number(h) * 60 + Number(mi)) * 60_000;
	return [at(m[1]!, m[2]!), at(m[3]!, m[4]!)];
}
