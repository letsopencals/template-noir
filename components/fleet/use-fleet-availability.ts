'use client';

import useSWR from 'swr';
import { fitsDates, rentalDays, type AvailabilityRange } from '@/lib/rental';
import { fetcher } from '@/lib/fetcher';
import { siteConfig } from '@/lib/site-config';

/** slug → fits the dates (true/false), or null when that car's ranges failed to load. */
export type FleetAvailability = Record<string, boolean | null>;

async function fetchFleetAvailability([, from, until, tz, ...slugs]: readonly string[]): Promise<FleetAvailability> {
	const params = new URLSearchParams({ from: from!, to: until!, timezone: tz! }).toString();
	const entries = await Promise.all(
		slugs.map(async (slug) => {
			try {
				const ranges = await fetcher<AvailabilityRange[]>(`/api/products/${encodeURIComponent(slug)}/ranges?${params}`);
				return [slug, fitsDates(Array.isArray(ranges) ? ranges : [], from!, until!, tz!)] as const;
			} catch {
				return [slug, null] as const;
			}
		}),
	);
	return Object.fromEntries(entries);
}

/**
 * Which cars are free for pick-up `from` → return `until` (local dates in the
 * store timezone). One SWR key for the whole fleet, fanned out in parallel to
 * each car's `/api/products/[slug]/ranges` (trimmed to the window, so the
 * payloads stay tiny). Nothing fetches until both dates are set and valid.
 */
export function useFleetAvailability(slugs: readonly string[], from: string | null, until: string | null) {
	const ready = Boolean(from && until && rentalDays(from, until) >= 1 && slugs.length > 0);
	const key = ready ? (['fleet-availability', from!, until!, siteConfig.timezone, ...slugs] as const) : null;

	const { data, isLoading, error } = useSWR(key, fetchFleetAvailability, {
		revalidateOnFocus: false,
		keepPreviousData: true,
	});

	return { availability: ready ? (data ?? null) : null, isLoading: ready && isLoading, error: error instanceof Error ? error : null };
}
