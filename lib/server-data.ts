import '@/lib/opencals';
import { cache } from 'react';
import {
	StoreService,
	ProductService,
	ProductCollectionService,
	type StorePublicSettings,
	type ProductListItemResponse,
	type ProductCollectionResponse,
} from '@opencals/storefront-sdk';
import { publicPayload } from '@/lib/public-payload';
import { fleetContent, siteConfig, carImages, type CarCategory, type CarContent, type CarImages } from '@/lib/site-config';

/**
 * Server-only data readers. Each is wrapped in React.cache() so repeated calls
 * within a single request are deduped. RSCs call these directly instead of
 * going through the template's own /api/* routes. Never import this module from
 * a 'use client' file — the /api/* routes remain the client/SWR data source.
 * Catalog reads pass through `publicPayload`, so staff contact fields never reach
 * RSC props.
 */

export const getStoreSettings = cache(async (): Promise<StorePublicSettings | null> => {
	try {
		const { data } = await StoreService.getStorePublicSettings();
		return data ?? null;
	} catch {
		return null;
	}
});

export const getProducts = cache(
	async (locationId?: string): Promise<ProductListItemResponse[]> => {
		try {
			const { data } = await ProductService.list({ query: { take: 50, locationId } });
			return publicPayload(data?.data ?? []);
		} catch {
			return [];
		}
	},
);

/**
 * A single product collection with its products, by slug (e.g. the `chauffeur`
 * packages). Returns null if the collection can't be loaded. Mirrors
 * `app/api/collections/[slug]`.
 */
export const getCollection = cache(
	async (slug: string): Promise<ProductCollectionResponse | null> => {
		try {
			const { data } = await ProductCollectionService.getBySlug({ path: { slug } });
			return data ? publicPayload(data) : null;
		} catch {
			return null;
		}
	},
);

/**
 * The booking flow needs each variant's `staffMembers` (with their `locations`)
 * and `locations` — that richer shape lives on the list response
 * (`ProductListItemResponse`), not the leaner `getBySlug` detail. So we fetch
 * the catalog and return the group that owns the requested slug (either the
 * group's own slug or one of its variant slugs). Mirrors
 * `app/api/products/[slug]/route.ts`.
 */
export const getProduct = cache(
	async (slug: string): Promise<ProductListItemResponse | null> => {
		try {
			const { data } = await ProductService.list({ query: { take: 100 } });
			const items = data?.data ?? [];
			const match = items.find(
				(item) => item.slug === slug || item.variants?.some((variant) => variant.slug === slug),
			);
			return match ? publicPayload(match) : null;
		} catch {
			return null;
		}
	},
);

/** All visible collections (with their product references). Empty on failure. */
export const getCollections = cache(async (): Promise<ProductCollectionResponse[]> => {
	try {
		const { data } = await ProductCollectionService.list({ query: { take: 50 } });
		return publicPayload(data?.data ?? []);
	} catch {
		return [];
	}
});

/* -------------------------------------------------------------------- Fleet */

const FLEET_CATEGORIES: readonly CarCategory[] = ['supercars', 'suvs', 'grand-tourers'];
const DAY_SECONDS = 86400;

/** A car = a store product merged with its editorial `fleetContent`. */
export interface FleetCar {
	id: string;
	slug: string;
	title: string;
	description: string;
	/** Price per base unit (one day for cars), in major units of `currency`. */
	pricePerDay: number;
	currency: string;
	/** Base duration in seconds (86400 for a day-priced car). */
	duration: number;
	/** Longest booking in seconds, or -1 for unlimited. */
	maxDuration: number;
	category: CarCategory | null;
	categoryLabel: string | null;
	/** Editorial specs; null when the slug has no entry in `fleetContent`. */
	content: CarContent | null;
	/**
	 * Image set. Local paths from `fleetContent` when present; otherwise every
	 * angle falls back to the product image from the store (or the expected
	 * local path, which degrades to the dark placeholder if missing).
	 */
	images: CarImages;
	/** The store's own product image URL, if any. */
	apiImage: string | null;
	/** The raw list item (variants, locations, staff) for the booking flow. */
	product: ProductListItemResponse;
}

function categoryFor(
	productId: string,
	slug: string,
	collections: ProductCollectionResponse[],
): CarCategory | null {
	for (const c of collections) {
		if ((FLEET_CATEGORIES as readonly string[]).includes(c.slug) && c.products?.some((p) => p.id === productId || p.productId === productId)) {
			return c.slug as CarCategory;
		}
	}
	return fleetContent[slug]?.category ?? null;
}

function toFleetCar(
	product: ProductListItemResponse,
	collections: ProductCollectionResponse[],
	currency: string,
): FleetCar {
	const content = fleetContent[product.slug] ?? null;
	const apiImage = product.image?.url ?? null;
	const fallback = carImages(product.slug);
	const images: CarImages = content
		? content.images
		: {
				side: apiImage ?? fallback.side,
				front: apiImage ?? fallback.front,
				interior: apiImage ?? fallback.interior,
				wheel: apiImage ?? fallback.wheel,
			};
	const category = categoryFor(product.id, product.slug, collections);
	return {
		id: product.id,
		slug: product.slug,
		title: product.title,
		description: product.description ?? '',
		pricePerDay: product.price,
		currency,
		duration: product.duration,
		maxDuration: product.maxDuration,
		category,
		categoryLabel: siteConfig.categories.find((c) => c.slug === category)?.label ?? null,
		content,
		images,
		apiImage,
		product,
	};
}

/**
 * The rentable fleet: every product that is not a chauffeur package, merged
 * with `fleetContent`, sorted by daily price (highest first).
 *
 * A product counts as a car when it is outside the `chauffeur` collection AND
 * it is in a fleet collection, has a `fleetContent` entry, or is day-priced.
 * Works (with less detail) when collections or content are missing.
 */
export const getFleet = cache(async (): Promise<FleetCar[]> => {
	const [products, collections, settings] = await Promise.all([
		getProducts(),
		getCollections(),
		getStoreSettings(),
	]);
	const currency = settings?.currency ?? siteConfig.currency;
	const chauffeur = collections.find((c) => c.slug === siteConfig.collections.chauffeur);
	const chauffeurIds = new Set((chauffeur?.products ?? []).flatMap((p) => [p.id, p.productId]));

	return products
		.filter((p) => !chauffeurIds.has(p.id))
		.map((p) => toFleetCar(p, collections, currency))
		.filter((car) => car.category !== null || car.content !== null || car.duration >= DAY_SECONDS)
		.sort((a, b) => b.pricePerDay - a.pricePerDay);
});

/** One car by product slug (or a variant slug), or null. */
export const getCar = cache(async (slug: string): Promise<FleetCar | null> => {
	const fleet = await getFleet();
	return (
		fleet.find((c) => c.slug === slug || c.product.variants?.some((v) => v.slug === slug)) ?? null
	);
});
