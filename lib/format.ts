import type { AddOnListItemResponse, ProductListItemResponse } from '@opencals/storefront-sdk';

/** Minimal shape shared by the various product/variant responses that carry imagery. */
interface WithImages {
	imageId?: string | null;
	image?: { url?: string | null } | null;
	images?: Array<{ id?: string; url?: string | null }> | null;
}

export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
	if (hours > 0) return `${hours}h`;
	return `${minutes} min`;
}

export function formatPrice(amount: number, currency = 'USD'): string {
	if (amount === 0) return 'Free';
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
	}).format(amount);
}

/**
 * The product's default image (the one picked in the dashboard). `image` isn't
 * on every response (the list omits it on the group), so fall back to the
 * `imageId` entry in `images`. `images` has no defined order, so its first
 * entry is never treated as the default.
 */
export function getProductImage(product: WithImages | undefined | null): string | null {
	return getProductGallery(product)[0] ?? null;
}

/**
 * The product's image set as managed in the dashboard: the default image first,
 * then the rest of `images` sorted by URL (the API returns them in no fixed
 * order), deduped. Empty when there are none.
 */
export function getProductGallery(product: WithImages | undefined | null): string[] {
	const images = product?.images ?? [];
	const byId = product?.imageId ? images.find((i) => i.id === product.imageId)?.url : null;
	const rest = images.map((i) => i.url).filter((u): u is string => Boolean(u)).sort();
	const urls = [product?.image?.url ?? byId, ...rest];
	return [...new Set(urls.filter((u): u is string => Boolean(u)))];
}

/**
 * `getProductGallery` for a GET /storefront/products item: the default `image`
 * and the full set live on the product's own variant, not on the group.
 */
export function getListItemGallery(product: ProductListItemResponse): string[] {
	const own = product.variants?.find((v) => v.id === product.id) ?? product.variants?.[0];
	return getProductGallery({ imageId: product.imageId, image: own?.image ?? product.image, images: own?.images });
}

/**
 * Compute the total price for a selected add-on at booking time.
 * For `durationMultiplied` add-ons, the per-unit price is multiplied by `durationUnits`
 * (the number of base-duration units the parent appointment spans).
 */
export function computeAddOnLineTotal(
	addOn: Pick<AddOnListItemResponse, 'price' | 'durationMultiplied'>,
	quantity: number,
	durationUnits: number,
): number {
	const unit = addOn.durationMultiplied ? addOn.price * durationUnits : addOn.price;
	return unit * quantity;
}

/**
 * Whole-unit price for marketing surfaces ("AED 2,500"). Prices on the
 * booking flow keep cents; here they read cleaner without.
 */
export function formatWholePrice(amount: number, currency: string): string {
	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			currencyDisplay: 'code',
			maximumFractionDigits: 0,
		})
			.format(amount)
			.replace(/\s/g, '\u00a0');
	} catch {
		return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
	}
}
