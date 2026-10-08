import type { FleetCar } from '@/lib/server-data';
import { fleetContent, siteConfig } from '@/lib/site-config';
import type { SpotlightCar } from './spotlight';
import type { HomeCar } from './types';

/** FleetCar (server) → the slim shape the home client components receive. */
export function toHomeCar(car: FleetCar): HomeCar {
	return {
		slug: car.slug,
		title: car.title,
		pricePerDay: Number.isFinite(car.pricePerDay) ? car.pricePerDay : null,
		currency: car.currency,
		categoryLabel: car.categoryLabel,
		tagline: car.content?.tagline ?? null,
		image: car.image,
	};
}

/**
 * The spotlight car (`siteConfig.marketing.spotlight.slug`), with specs from
 * `fleetContent` and price from the store when available. Null if the slug has
 * no editorial entry.
 */
export function toSpotlightCar(fleet: FleetCar[]): SpotlightCar | null {
	const copy = siteConfig.marketing.spotlight;
	const content = fleetContent[copy.slug];
	if (!content) return null;
	const live = fleet.find((c) => c.slug === copy.slug) ?? null;
	return {
		slug: copy.slug,
		name: copy.name,
		fullName: live?.title ?? copy.fullName,
		tagline: content.tagline,
		engine: content.engine,
		image: live?.image ?? null,
		hp: content.hp,
		zeroToHundred: content.zeroToHundred,
		topSpeed: content.topSpeed,
		pricePerDay: live && Number.isFinite(live.pricePerDay) ? live.pricePerDay : null,
		currency: live?.currency ?? siteConfig.currency,
	};
}
