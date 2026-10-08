'use client';

import { useEffect, useState } from 'react';
import type { ProductListVariant } from '@opencals/storefront-sdk';

const DEFAULT_MAX_UNITS = 12;

/**
 * Custom booking length for `allowCustomDuration` products (e.g. "Chauffeur by
 * the hour"): a whole number of base units between 1 and `maxDuration / duration`.
 * `durationSeconds` is null for fixed-length products, so availability uses
 * the product's own duration.
 */
export function useCustomDuration(variant: ProductListVariant | null) {
	const base = variant?.duration ?? 0;
	const enabled = !!variant?.allowCustomDuration && base > 0;
	const maxUnits = enabled
		? variant!.maxDuration > 0
			? Math.max(1, Math.floor(variant!.maxDuration / base))
			: DEFAULT_MAX_UNITS
		: 1;
	const [units, setUnitsState] = useState(1);

	// Back to one unit when the product changes.
	useEffect(() => {
		setUnitsState(1);
	}, [variant?.id]);

	const setUnits = (n: number) => setUnitsState(Math.min(maxUnits, Math.max(1, Math.round(n))));

	return {
		enabled,
		units: Math.min(units, maxUnits),
		setUnits,
		maxUnits,
		baseSeconds: base,
		durationSeconds: enabled ? Math.min(units, maxUnits) * base : null,
	};
}

export type CustomDuration = ReturnType<typeof useCustomDuration>;
