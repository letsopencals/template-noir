/**
 * Shared class strings for marketing surfaces. Kept as literals so Tailwind
 * picks the arbitrary values up from source.
 */

/** Feathers a studio car photo into the black page (no visible rectangle). */
export const FEATHER_MASK =
	'[mask-image:radial-gradient(ellipse_at_center,#000_55%,transparent_75%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,#000_55%,transparent_75%)]';

/** Standard page container. */
export const CONTAINER = 'mx-auto w-full max-w-[1600px] px-5 lg:px-10';

/** Vertical rhythm for a marketing section. */
export const SECTION_Y = 'py-[var(--spacing-section-sm)] lg:py-[var(--spacing-section)]';
