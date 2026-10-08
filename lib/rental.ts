import moment from 'moment-timezone';

/**
 * Pure helpers for day-based car rentals.
 *
 * Model (see CLAUDE.md "Rentals"): a car is one product with a 1-day base
 * duration (86400 s) and `allowCustomDuration`, on a continuous 24/7 schedule.
 * A booking runs from the pick-up date 00:00 to the return date 00:00 in the
 * store timezone, so N days = N base units = N × daily price. The handover
 * window ("10:00–12:00") is NOT part of the slot; it travels as an appointment
 * custom attribute.
 *
 * Dates named `*Date` are local calendar dates `YYYY-MM-DD` in the store
 * timezone. Instants are anything `Date.parse`-able or epoch ms. Availability
 * ranges are the SDK's `CurrentAvailabilitySlot` (UTC `fromDate`/`fromTime`/
 * `toDate`/`toTime`).
 */

/** The range shape returned by `getCurrentAvailabilitiesMerged` (UTC). */
export interface AvailabilityRange {
	fromDate: string;
	fromTime: string;
	toDate: string;
	toTime: string;
}

/** Time part of the slot `AppointmentService.create` expects (all UTC). */
export interface RentalSlotTimes {
	/** 'YYYY-MM-DD' (UTC) */
	fromDate: string;
	/** 'HH:mm:ss' (UTC) */
	fromTime: string;
	/** 'YYYY-MM-DD' (UTC) */
	toDate: string;
	/** 'HH:mm:ss' (UTC) */
	toTime: string;
}

export type Instant = Date | string | number;

export interface EstimateAddOn {
	/** Unit price, major units. */
	price: number;
	/** True for per-day extras (charged price × days × quantity). */
	durationMultiplied?: boolean;
	/** Default 1. */
	quantity?: number;
}

export interface RentalEstimate {
	days: number;
	/** dailyPrice × days */
	base: number;
	/** Sum of extras */
	extras: number;
	total: number;
}

const DAY_MS = 86_400_000;
/**
 * Ranges that touch, or are separated by at most this much, are treated as one.
 * Tolerates a 1-second end-of-day seam (23:59:59 → 00:00) from the backend.
 */
const SEAM_TOLERANCE_MS = 1_000;
const DATE_FORMAT = 'YYYY-MM-DD';

function toMs(value: Instant): number {
	return typeof value === 'number' ? value : value instanceof Date ? value.getTime() : Date.parse(value);
}

/** Epoch ms of local midnight at the start of `date` in `tz`. */
export function localMidnight(date: string, tz: string): number {
	return moment.tz(date, DATE_FORMAT, true, tz).valueOf();
}

/** UTC start/end (epoch ms) of an availability range. */
export function rangeBounds(range: AvailabilityRange): { start: number; end: number } {
	return {
		start: Date.parse(`${range.fromDate}T${range.fromTime}Z`),
		end: Date.parse(`${range.toDate}T${range.toTime}Z`),
	};
}

/** Sorted, seam-merged intervals (epoch ms) from raw ranges. */
export function mergeRanges(ranges: readonly AvailabilityRange[]): Array<{ start: number; end: number }> {
	const sorted = ranges
		.map(rangeBounds)
		.filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start)
		.sort((a, b) => a.start - b.start);
	const out: Array<{ start: number; end: number }> = [];
	for (const r of sorted) {
		const last = out[out.length - 1];
		if (last && r.start <= last.end + SEAM_TOLERANCE_MS) last.end = Math.max(last.end, r.end);
		else out.push({ ...r });
	}
	return out;
}

/**
 * Number of rental days between two local dates (return − pick-up). Same day
 * or a return before pick-up → 0.
 *
 * @example rentalDays('2026-11-10', '2026-11-13') // 3
 */
export function rentalDays(fromDate: string, untilDate: string): number {
	// Noon UTC on both sides keeps the subtraction DST-proof.
	const a = Date.parse(`${fromDate}T12:00:00Z`);
	const b = Date.parse(`${untilDate}T12:00:00Z`);
	if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
	return Math.max(0, Math.round((b - a) / DAY_MS));
}

/**
 * True when [from, until) lies entirely inside ONE (seam-merged) range. This
 * is the client-side mirror of the backend's containment check; the server
 * still validates on booking.
 */
export function fitsRange(ranges: readonly AvailabilityRange[], from: Instant, until: Instant): boolean {
	const start = toMs(from);
	const end = toMs(until);
	if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false;
	return mergeRanges(ranges).some((r) => r.start <= start && r.end >= end);
}

/** Convenience: does pick-up `fromDate` 00:00 → return `untilDate` 00:00 (local) fit? */
export function fitsDates(
	ranges: readonly AvailabilityRange[],
	fromDate: string,
	untilDate: string,
	tz: string,
): boolean {
	if (rentalDays(fromDate, untilDate) < 1) return false;
	return fitsRange(ranges, localMidnight(fromDate, tz), localMidnight(untilDate, tz));
}

/** True when the whole local day `date` (00:00 → next 00:00) is free. */
export function isDayAvailable(ranges: readonly AvailabilityRange[], date: string, tz: string): boolean {
	const start = localMidnight(date, tz);
	return fitsRange(ranges, start, moment.tz(start, tz).add(1, 'day').valueOf());
}

/**
 * Latest return date reachable from pick-up `fromDate` without crossing a
 * booking, capped at `maxDays`. Returns null if `fromDate` itself isn't free.
 * Use it to grey out return dates in a range picker.
 */
export function latestReturnDate(
	ranges: readonly AvailabilityRange[],
	fromDate: string,
	tz: string,
	maxDays = 30,
): string | null {
	const start = localMidnight(fromDate, tz);
	const range = mergeRanges(ranges).find((r) => r.start <= start && r.end > start);
	if (!range) return null;
	let days = 0;
	const cursor = moment.tz(start, tz);
	while (days < maxDays) {
		const next = cursor.clone().add(1, 'day');
		if (next.valueOf() > range.end) break;
		cursor.add(1, 'day');
		days += 1;
	}
	return days >= 1 ? cursor.format(DATE_FORMAT) : null;
}

/**
 * Builds the time part of the appointment slot: local 00:00 of each date,
 * converted to UTC. Spread it into the full slot for `/api/book`:
 *
 * ```ts
 * slot: { productId, ...toAppointmentSlot(from, until, 'Asia/Dubai'), staffMemberId: null, locationId }
 * // Dubai (UTC+4), 10 → 13 Nov:
 * // { fromDate: '2026-11-09', fromTime: '20:00:00', toDate: '2026-11-12', toTime: '20:00:00' }
 * ```
 */
export function toAppointmentSlot(fromDate: string, untilDate: string, tz: string): RentalSlotTimes {
	const from = moment.tz(fromDate, DATE_FORMAT, true, tz).utc();
	const until = moment.tz(untilDate, DATE_FORMAT, true, tz).utc();
	return {
		fromDate: from.format(DATE_FORMAT),
		fromTime: from.format('HH:mm:ss'),
		toDate: until.format(DATE_FORMAT),
		toTime: until.format('HH:mm:ss'),
	};
}

/**
 * Client-side price preview: days × daily rate + extras. Mirrors the
 * backend (`ceil(booked / base) × price`, per-day add-ons × units), but the
 * cart total from the API is the source of truth.
 */
export function estimate(dailyPrice: number, days: number, addOns: readonly EstimateAddOn[] = []): RentalEstimate {
	const d = Math.max(0, Math.floor(days));
	const base = dailyPrice * d;
	const extras = addOns.reduce((sum, a) => {
		const qty = a.quantity ?? 1;
		return sum + (a.durationMultiplied ? a.price * d : a.price) * qty;
	}, 0);
	return { days: d, base, extras, total: base + extras };
}

/** Today's date in `tz`, YYYY-MM-DD. */
export function todayIn(tz: string): string {
	return moment.tz(tz).format(DATE_FORMAT);
}

/** `date` plus `n` days, YYYY-MM-DD (calendar maths, no timezone needed). */
export function addDays(date: string, n: number): string {
	return moment.utc(date, DATE_FORMAT, true).add(n, 'day').format(DATE_FORMAT);
}
