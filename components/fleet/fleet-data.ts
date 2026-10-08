import type { FleetCar } from '@/lib/server-data';
import type { CarCategory, CarContent } from '@/lib/site-config';
import { formatWholePrice } from '@/lib/format';

/**
 * The slim, serialisable slice of a `FleetCar` that client components need.
 * Server pages map with `toCarCard()` so the raw product (variants, staff,
 * locations) never travels in the RSC payload.
 */
export interface CarCardData {
	slug: string;
	title: string;
	description: string;
	pricePerDay: number;
	currency: string;
	category: CarCategory | null;
	categoryLabel: string | null;
	content: CarContent | null;
	/** Default product image, or null (renders the dark placeholder). */
	image: string | null;
	/** Every product image, default first (from the store, not the template). */
	gallery: string[];
	/** Longest rental in whole days, or null for unlimited. */
	maxDays: number | null;
}

const DAY_SECONDS = 86400;

export function toCarCard(car: FleetCar): CarCardData {
	return {
		slug: car.slug,
		title: car.title,
		description: car.description,
		pricePerDay: car.pricePerDay,
		currency: car.currency,
		category: car.category,
		categoryLabel: car.categoryLabel,
		content: car.content,
		image: car.image,
		gallery: car.gallery,
		maxDays: car.maxDuration > 0 ? Math.max(1, Math.floor(car.maxDuration / DAY_SECONDS)) : null,
	};
}

/** "AED 6,500" — whole units, grouped, currency code first (the local convention). */
/** Whole-unit price ("AED 6,500"). Shared with the marketing pages via lib/format. */
export const formatMoney = formatWholePrice;

/** Strips the make for the giant backdrop word ("Rolls-Royce Cullinan" → "Cullinan"). */
export function modelName(title: string): string {
	const known = ['Rolls-Royce', 'Mercedes-AMG', 'Aston Martin', 'Range Rover', 'Lamborghini', 'Ferrari', 'McLaren', 'Bentley', 'Porsche'];
	for (const make of known) {
		if (title.startsWith(`${make} `)) return title.slice(make.length + 1);
	}
	const parts = title.split(' ');
	return parts.length > 1 ? parts.slice(1).join(' ') : title;
}

/** Builds `/book?car=…&from=…&until=…`, omitting empty dates. */
export function bookHref(slug: string, from?: string | null, until?: string | null): string {
	const params = new URLSearchParams({ car: slug });
	if (from) params.set('from', from);
	if (until) params.set('until', until);
	return `/book?${params}`;
}

/** Builds `/fleet/<slug>` and carries chosen dates along. */
export function carHref(slug: string, from?: string | null, until?: string | null): string {
	if (!from || !until) return `/fleet/${slug}`;
	return `/fleet/${slug}?${new URLSearchParams({ from, until })}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A valid YYYY-MM-DD or null. */
export function parseDateParam(value: string | null | undefined): string | null {
	return value && DATE_RE.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) ? value : null;
}

/** The make part of a title ("Aston Martin DB12" → "Aston Martin"). */
export function makeName(title: string): string {
	const model = modelName(title);
	return model === title ? title : title.slice(0, title.length - model.length).trim();
}
