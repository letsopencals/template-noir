export { formatWholePrice } from '@/lib/format';

/** "rolls-royce-cullinan" → "Rolls Royce Cullinan" (fallback when the API is unavailable). */
export function titleFromSlug(slug: string): string {
	return slug
		.split('-')
		.map((part) => (part.length <= 3 && /\d/.test(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
		.join(' ');
}
