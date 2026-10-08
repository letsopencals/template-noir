'use client';

import useSWR from 'swr';
import type { CurrentAvailabilitySlot } from '@opencals/storefront-sdk';
import { fetcher } from '@/lib/fetcher';
import { siteConfig } from '@/lib/site-config';

export interface UseCarRangesOptions {
	/** Local date window to trim to, YYYY-MM-DD (optional; omit for the full horizon). */
	from?: string | null;
	to?: string | null;
	/** Defaults to the store timezone (Asia/Dubai), NOT the browser's. */
	timezone?: string;
	locationId?: string | null;
	/** Seconds as a string; defaults to the product base (one day). */
	duration?: string | null;
	/** Seed from the server to avoid a loading flash. */
	fallbackData?: CurrentAvailabilitySlot[];
}

/**
 * Merged availability ranges (UTC) for one car via `/api/products/{slug}/ranges`.
 * Key is null — nothing fetches — until `slug` is set. Pair with `fitsRange` /
 * `blockedDays` from `lib/rental.ts`.
 */
export function useCarRanges(slug: string | null | undefined, options: UseCarRangesOptions = {}) {
	const { from, to, timezone = siteConfig.timezone, locationId, duration, fallbackData } = options;

	let key: string | null = null;
	if (slug) {
		const params = new URLSearchParams({ timezone });
		if (from) params.set('from', from);
		if (to) params.set('to', to);
		if (locationId) params.set('locationId', locationId);
		if (duration) params.set('duration', duration);
		key = `/api/products/${encodeURIComponent(slug)}/ranges?${params}`;
	}

	const { data, error, isLoading, mutate } = useSWR<CurrentAvailabilitySlot[]>(key, fetcher, {
		revalidateOnFocus: false,
		keepPreviousData: true,
		fallbackData,
	});

	return {
		ranges: Array.isArray(data) ? data : [],
		isLoading,
		error: error instanceof Error ? error : null,
		/** Re-fetch after a booking attempt is rejected (someone else took the dates). */
		refresh: mutate,
	};
}
