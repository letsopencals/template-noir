import type { ProductListVariant, ProductListVariantLocation } from '@opencals/storefront-sdk';
import type { FleetCar } from '@/lib/server-data';
import type { CarImages } from '@/lib/site-config';
import { siteConfig } from '@/lib/site-config';
import { rentalDays, todayIn } from '@/lib/rental';

/** The slice of a fleet car the /book page needs on the client. */
export interface BookCar {
	id: string;
	slug: string;
	title: string;
	tagline: string | null;
	categoryLabel: string | null;
	pricePerDay: number;
	currency: string;
	/** Longest rental, days (30 when unlimited or unknown). */
	maxDays: number;
	depositAed: number | null;
	kmPerDay: number | null;
	minAge: number | null;
	images: CarImages;
	/** The bookable variant (add-ons and locations hang off it). */
	variant: ProductListVariant | null;
	garage: ProductListVariantLocation | null;
	delivery: ProductListVariantLocation | null;
}

const DAY = 86_400;
const DEFAULT_MAX_DAYS = 30;

/** Server-side: trim a FleetCar for the client (no-`'use client'` module, safe in RSC). */
export function toBookCar(car: FleetCar): BookCar {
	const variant = car.product.variants?.find((v) => v.id === car.id) ?? car.product.variants?.[0] ?? null;
	const locations = variant?.locations ?? [];
	const maxDays =
		car.maxDuration > 0 && car.duration > 0
			? Math.max(1, Math.floor(car.maxDuration / Math.max(car.duration, DAY)))
			: DEFAULT_MAX_DAYS;
	return {
		id: car.id,
		slug: car.slug,
		title: car.title,
		tagline: car.content?.tagline ?? null,
		categoryLabel: car.categoryLabel,
		pricePerDay: car.pricePerDay,
		currency: car.currency,
		maxDays: Math.min(maxDays, DEFAULT_MAX_DAYS),
		depositAed: car.content?.depositAed ?? null,
		kmPerDay: car.content?.kmPerDay ?? null,
		minAge: car.content?.minAge ?? null,
		images: car.images,
		variant: variant ? { ...variant, staffMembers: [] } : null,
		garage: locations.find((l) => l.type === siteConfig.locationTypes.garage) ?? null,
		delivery: locations.find((l) => l.type === siteConfig.locationTypes.delivery) ?? null,
	};
}

export type { HandoverMode } from '@/hooks/use-rental-handover';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates URL dates against today and `maxDays`; bad input becomes null. */
export function sanitizeRange(
	from: string | null | undefined,
	until: string | null | undefined,
	tz: string,
	maxDays = 30,
): { from: string | null; until: string | null } {
	const today = todayIn(tz);
	const f = from && DATE_RE.test(from) && from >= today ? from : null;
	if (!f) return { from: null, until: null };
	const u = until && DATE_RE.test(until) ? until : null;
	const days = u ? rentalDays(f, u) : 0;
	return { from: f, until: u && days >= 1 && days <= maxDays ? u : null };
}
