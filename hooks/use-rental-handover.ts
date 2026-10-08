'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppointmentAddress } from '@opencals/storefront-sdk';
import { siteConfig } from '@/lib/site-config';
import { addDays, rentalDays } from '@/lib/rental';

export type HandoverMode = 'delivery' | 'garage';

export interface HandoverAddress {
	/** Hotel, villa, building or terminal. */
	line1: string;
	/** Room, apartment, villa number. */
	line2: string;
	/** Area, e.g. "Dubai Marina". */
	area: string;
	city: string;
}

export interface RentalHandoverInit {
	carSlug: string;
	from: string | null;
	until: string | null;
	mode: HandoverMode;
}

const EMPTY_ADDRESS: HandoverAddress = { line1: '', line2: '', area: '', city: 'Dubai' };
const KEYS = siteConfig.customAttributeKeys;

/**
 * State for the "When & where" step of /book: car, dates, handover and return
 * windows, deliver-vs-collect, the delivery address and an optional different
 * collection address. Car, dates and mode mirror into the URL
 * (`/book?car&from&until&mode`) with `history.replaceState`, so a reload or a
 * shared link restores them without a server round trip.
 */
export function useRentalHandover(init: RentalHandoverInit) {
	const tz = siteConfig.timezone;
	const [carSlug, setCarSlug] = useState(init.carSlug);
	const [from, setFrom] = useState<string | null>(init.from);
	const [until, setUntil] = useState<string | null>(init.until);
	const [mode, setMode] = useState<HandoverMode>(init.mode);
	const [handoverTime, setHandoverTime] = useState<string | null>(null);
	const [returnTime, setReturnTime] = useState<string | null>(null);
	const [address, setAddress] = useState<HandoverAddress>(EMPTY_ADDRESS);
	const [returnElsewhere, setReturnElsewhere] = useState(false);
	const [collectAddress, setCollectAddress] = useState('');
	const [flightNumber, setFlightNumber] = useState('');

	useEffect(() => {
		const params = new URLSearchParams({ car: carSlug });
		if (from) params.set('from', from);
		if (until) params.set('until', until);
		params.set('mode', mode);
		const next = `/book?${params}`;
		if (`${window.location.pathname}${window.location.search}` !== next) {
			window.history.replaceState(window.history.state, '', next);
		}
	}, [carSlug, from, until, mode]);

	const setRange = useCallback((v: { from: string | null; until: string | null }) => {
		setFrom(v.from);
		setUntil(v.until);
	}, []);

	const updateAddress = useCallback((patch: Partial<HandoverAddress>) => {
		setAddress((prev) => ({ ...prev, ...patch }));
	}, []);

	const days = from && until ? rentalDays(from, until) : 0;
	const addressValid = mode === 'garage' || (address.line1.trim().length > 2 && address.city.trim().length > 1);
	const collectValid = !returnElsewhere || collectAddress.trim().length > 4;
	const timesValid = handoverTime !== null && returnTime !== null;

	/** Delivery address for the appointment (null when collecting at the garage). */
	const appointmentAddress = useMemo<AppointmentAddress | null>(() => {
		if (mode !== 'delivery' || !address.line1.trim()) return null;
		return {
			addressLine1: address.line1.trim(),
			...(address.line2.trim() ? { addressLine2: address.line2.trim() } : {}),
			city: address.city.trim() || 'Dubai',
			...(address.area.trim() ? { state: address.area.trim() } : {}),
			country: siteConfig.country,
		};
	}, [mode, address]);

	/** Appointment custom attributes (keys from `siteConfig.customAttributeKeys`). */
	const customAttributes = useMemo(() => {
		const out: Record<string, string> = {};
		if (handoverTime) out[KEYS.handoverTime] = handoverTime;
		if (returnTime) out[KEYS.returnTime] = returnTime;
		if (returnElsewhere && collectAddress.trim()) out[KEYS.collectAddress] = collectAddress.trim();
		if (mode === 'delivery' && flightNumber.trim()) out[KEYS.flightNumber] = flightNumber.trim().toUpperCase();
		return out;
	}, [handoverTime, returnTime, returnElsewhere, collectAddress, mode, flightNumber]);

	return {
		tz,
		carSlug,
		setCarSlug,
		from,
		until,
		setRange,
		days,
		mode,
		setMode,
		handoverTime,
		setHandoverTime,
		returnTime,
		setReturnTime,
		address,
		updateAddress,
		returnElsewhere,
		setReturnElsewhere,
		collectAddress,
		setCollectAddress,
		flightNumber,
		setFlightNumber,
		addressValid,
		collectValid,
		timesValid,
		appointmentAddress,
		customAttributes,
		/** The return date one day after `from`, for quick "1 day" hints. */
		nextDay: from ? addDays(from, 1) : null,
	};
}

export type RentalHandover = ReturnType<typeof useRentalHandover>;
