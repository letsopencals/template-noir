/**
 * Slim, serialisable car shape for the home page's client components (so the
 * full product payload isn't shipped to the browser).
 */
export interface HomeCar {
	slug: string;
	title: string;
	/** Daily price in major units, or null when the API is unavailable. */
	pricePerDay: number | null;
	currency: string;
	categoryLabel: string | null;
	tagline: string | null;
	/** Side-profile image. */
	image: string | null;
}
