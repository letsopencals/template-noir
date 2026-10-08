'use client';

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { motion, type Transition } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { EASE_OUT } from '@/components/motion/easing';
import {
	addDays,
	isDayAvailable,
	latestReturnDate,
	rentalDays,
	todayIn,
	type AvailabilityRange,
} from '@/lib/rental';

/**
 * Two-month rental range picker (one month below `md`, or when `months={1}`).
 *
 * - Dates are local `YYYY-MM-DD` in `timezone` (the store timezone).
 * - Pick-up days must be fully free (`isDayAvailable`). Once a pick-up date is
 *   chosen, return days are enabled up to `latestReturnDate` (end of the
 *   containing free range, capped at `maxDays`). The return day itself does not
 *   need to be free: the car comes back at 00:00 that day.
 * - Keyboard: arrows move by day/week, PageUp/PageDown by month, Home/End to
 *   the start/end of the week, Enter/Space selects. Roving tabindex.
 */
export interface RangeValue {
	from: string | null;
	until: string | null;
}

export interface RangeCalendarProps {
	ranges: AvailabilityRange[];
	timezone: string;
	value: RangeValue;
	onChange(v: RangeValue): void;
	/** Longest rental in days. Default 30. */
	maxDays?: number;
	/** Force one or two months. Default 2 (one on mobile). */
	months?: 1 | 2;
	/** Earliest selectable date. Default today in `timezone`. */
	minDate?: string;
	/** Ranges are still loading: days stay neutral (not struck through) and unclickable. */
	loading?: boolean;
	/** Show the Selected / Free / Booked key under the grid. Default true. */
	showLegend?: boolean;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const MONTH_FMT = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const DAY_LABEL_FMT = new Intl.DateTimeFormat('en-GB', {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC',
});

const FILL_TRANSITION: Transition = { duration: 0.45, ease: EASE_OUT };
const CAP_TRANSITION: Transition = { type: 'spring', stiffness: 520, damping: 42, mass: 0.7 };
const NO_TRANSITION: Transition = { duration: 0 };
const FILL_INITIAL = { scaleX: 0, opacity: 0 };
const FILL_ANIMATE = { scaleX: 1, opacity: 1 };

/* ------------------------------------------------------------- date maths */

/** First of the month for a date, 'YYYY-MM-01'. */
function monthStart(date: string): string {
	return `${date.slice(0, 7)}-01`;
}

function addMonths(month: string, n: number): string {
	const y = Number(month.slice(0, 4));
	const m = Number(month.slice(5, 7));
	const d = new Date(Date.UTC(y, m - 1 + n, 1));
	return d.toISOString().slice(0, 10);
}

function toUtcDate(date: string): Date {
	return new Date(`${date}T00:00:00Z`);
}

/** Monday-first weekday index 0..6. */
function weekdayIndex(date: string): number {
	return (toUtcDate(date).getUTCDay() + 6) % 7;
}

function daysInMonth(month: string): number {
	const y = Number(month.slice(0, 4));
	const m = Number(month.slice(5, 7));
	return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Grid weeks for a month: arrays of 7 (date | null for padding). */
function monthGrid(month: string): Array<Array<string | null>> {
	const lead = weekdayIndex(month);
	const total = daysInMonth(month);
	const cells: Array<string | null> = Array.from({ length: lead }, () => null);
	for (let i = 0; i < total; i++) cells.push(addDays(month, i));
	while (cells.length % 7 !== 0) cells.push(null);
	const weeks: Array<Array<string | null>> = [];
	for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
	return weeks;
}

/* ---------------------------------------------------------------- types */

type DayState = {
	disabled: boolean;
	/** Booked / not free: struck through. */
	struck: boolean;
	isStart: boolean;
	isEnd: boolean;
	inRange: boolean;
	inPreview: boolean;
	/** Hovered return candidate (outlined cap). */
	isPreviewEnd: boolean;
	/** Band continues to the right / left of a cap. */
	joinRight: boolean;
	joinLeft: boolean;
	/** A return date is chosen (strong tint) vs. a hover preview (light tint). */
	rangeCommitted: boolean;
	isToday: boolean;
};

/* ------------------------------------------------------------- component */

export function RangeCalendar({
	ranges,
	timezone,
	value,
	onChange,
	maxDays = 30,
	months = 2,
	minDate,
	loading = false,
	showLegend = true,
}: RangeCalendarProps) {
	const reduce = useReducedMotion();
	const uid = useId();
	const today = useMemo(() => todayIn(timezone), [timezone]);
	const earliest = minDate && minDate > today ? minDate : today;

	const { from, until } = value;
	const pickingReturn = from !== null && until === null;

	const [viewMonth, setViewMonth] = useState(() => monthStart(from ?? earliest));
	const [focusDate, setFocusDate] = useState<string>(() => from ?? earliest);
	const [hoverDate, setHoverDate] = useState<string | null>(null);
	const gridRef = useRef<HTMLDivElement>(null);
	const shouldFocusRef = useRef(false);

	// Follow an externally-set pick-up date (e.g. from the URL) into view.
	useEffect(() => {
		if (!from) return;
		setViewMonth((vm) => {
			const end = addMonths(vm, months);
			return from >= vm && from < end ? vm : monthStart(from);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [from]);

	const latestReturn = useMemo(
		() => (from ? latestReturnDate(ranges, from, timezone, maxDays) : null),
		[ranges, from, timezone, maxDays],
	);

	const visibleMonths = useMemo(
		() => Array.from({ length: months }, (_, i) => addMonths(viewMonth, i)),
		[viewMonth, months],
	);

	// Free-day lookup for every visible date (one pass per ranges/month change).
	const freeDays = useMemo(() => {
		const set = new Set<string>();
		for (const m of visibleMonths) {
			const n = daysInMonth(m);
			for (let i = 0; i < n; i++) {
				const d = addDays(m, i);
				if (d >= earliest && isDayAvailable(ranges, d, timezone)) set.add(d);
			}
		}
		return set;
	}, [visibleMonths, ranges, timezone, earliest]);

	const isReturnCandidate = useCallback(
		(d: string) => pickingReturn && from !== null && latestReturn !== null && d > from && d <= latestReturn,
		[pickingReturn, from, latestReturn],
	);

	const isSelectable = useCallback(
		(d: string) => {
			if (d < earliest) return false;
			// While choosing a return date, nothing past the latest reachable return
			// is clickable. Earlier free days still restart the selection.
			if (pickingReturn && from !== null && d > from) return isReturnCandidate(d);
			if (pickingReturn && d === from) return true;
			return freeDays.has(d);
		},
		[earliest, pickingReturn, from, isReturnCandidate, freeDays],
	);

	const previewEnd = pickingReturn && hoverDate && isReturnCandidate(hoverDate) ? hoverDate : null;

	const stateFor = useCallback(
		(d: string): DayState => {
			const selectable = !loading && isSelectable(d);
			const struck = !loading && d >= earliest && !freeDays.has(d) && !isReturnCandidate(d);
			return {
				disabled: !selectable,
				struck,
				isStart: d === from,
				isEnd: d === until,
				inRange: from !== null && until !== null && d > from && d < until,
				inPreview: from !== null && previewEnd !== null && d > from && d < previewEnd,
				isPreviewEnd: previewEnd !== null && d === previewEnd,
				joinRight: d === from && (until !== null || previewEnd !== null),
				joinLeft: (until !== null && d === until) || (previewEnd !== null && d === previewEnd),
				rangeCommitted: until !== null,
				isToday: d === today,
			};
		},
		[loading, isSelectable, earliest, freeDays, isReturnCandidate, from, until, previewEnd, today],
	);

	const select = useCallback(
		(d: string) => {
			if (loading || !isSelectable(d)) return;
			if (pickingReturn && isReturnCandidate(d)) {
				onChange({ from, until: d });
				return;
			}
			if (pickingReturn && d === from) {
				onChange({ from: null, until: null });
				return;
			}
			if (freeDays.has(d)) onChange({ from: d, until: null });
		},
		[loading, isSelectable, pickingReturn, isReturnCandidate, onChange, from, freeDays],
	);

	const moveFocus = useCallback(
		(next: string) => {
			setFocusDate(next);
			shouldFocusRef.current = true;
			setViewMonth((vm) => {
				const end = addMonths(vm, months);
				if (next < vm) return monthStart(next);
				if (next >= end) return addMonths(monthStart(next), -(months - 1));
				return vm;
			});
		},
		[months],
	);

	// Move DOM focus after a keyboard move re-renders the grid.
	useEffect(() => {
		if (!shouldFocusRef.current) return;
		shouldFocusRef.current = false;
		const el = gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`);
		el?.focus();
	}, [focusDate, viewMonth]);

	const onKeyDown = useCallback(
		(e: KeyboardEvent<HTMLButtonElement>, d: string) => {
			let next: string | null = null;
			switch (e.key) {
				case 'ArrowLeft':
					next = addDays(d, -1);
					break;
				case 'ArrowRight':
					next = addDays(d, 1);
					break;
				case 'ArrowUp':
					next = addDays(d, -7);
					break;
				case 'ArrowDown':
					next = addDays(d, 7);
					break;
				case 'Home':
					next = addDays(d, -weekdayIndex(d));
					break;
				case 'End':
					next = addDays(d, 6 - weekdayIndex(d));
					break;
				case 'PageUp': {
					const m = addMonths(monthStart(d), -1);
					next = addDays(m, Math.min(Number(d.slice(8)), daysInMonth(m)) - 1);
					break;
				}
				case 'PageDown': {
					const m = addMonths(monthStart(d), 1);
					next = addDays(m, Math.min(Number(d.slice(8)), daysInMonth(m)) - 1);
					break;
				}
				case 'Enter':
				case ' ':
					e.preventDefault();
					select(d);
					return;
				default:
					return;
			}
			e.preventDefault();
			if (next < monthStart(earliest)) return;
			moveFocus(next);
		},
		[select, moveFocus, earliest],
	);

	const canGoBack = viewMonth > monthStart(earliest);
	// Roving tabindex target must be on screen.
	const lastVisible = addDays(addMonths(viewMonth, months), -1);
	const tabStop = focusDate >= viewMonth && focusDate <= lastVisible ? focusDate : (from && from >= viewMonth && from <= lastVisible ? from : viewMonth);

	const days = from && until ? rentalDays(from, until) : 0;
	const status = loading
		? 'Checking availability…'
		: !from
		? 'Choose a pick-up date'
		: !until
			? latestReturn
				? 'Now choose a return date'
				: 'This date has no free return day. Choose another pick-up date.'
			: `${days} ${days === 1 ? 'day' : 'days'}`;

	return (
		<div className="select-none">
			<div className="mb-5 flex items-center justify-between gap-3">
				<p className="text-[0.7rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)]" aria-live="polite">
					{status}
				</p>
				<div className="flex items-center gap-1.5">
					<NavButton
						label="Previous month"
						disabled={!canGoBack}
						onClick={() => setViewMonth((vm) => addMonths(vm, -1))}
						dir="prev"
					/>
					<NavButton label="Next month" onClick={() => setViewMonth((vm) => addMonths(vm, 1))} dir="next" />
				</div>
			</div>

			<div
				ref={gridRef}
				aria-busy={loading || undefined}
				className={clsx(
					'grid gap-x-10 gap-y-8 transition-opacity duration-300',
					months === 2 ? 'md:grid-cols-2' : '',
					loading ? 'animate-pulse opacity-50' : '',
				)}
				onMouseLeave={() => setHoverDate(null)}
			>
				{visibleMonths.map((m, idx) => (
					<MonthGrid
						key={m}
						month={m}
						hideOnMobile={idx > 0}
						uid={uid}
						tabStop={tabStop}
						stateFor={stateFor}
						onSelect={select}
						onHover={setHoverDate}
						onKeyDown={onKeyDown}
						onFocusDay={setFocusDate}
						reduce={!!reduce}
					/>
				))}
			</div>

			{showLegend ? (
				<div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.68rem] uppercase tracking-[0.2em] text-[var(--color-ink-dim)]">
					<span className="inline-flex items-center gap-2">
						<span className="h-2.5 w-2.5 bg-[var(--color-primary)]" aria-hidden /> Selected
					</span>
					<span className="inline-flex items-center gap-2">
						<span className="h-2.5 w-2.5 border border-[var(--color-line-strong)]" aria-hidden /> Free
					</span>
					<span className="inline-flex items-center gap-2">
						<span className="tabular line-through decoration-[var(--color-ink-dim)]" aria-hidden>
							14
						</span>{' '}
						Booked
					</span>
				</div>
			) : null}
		</div>
	);
}

/* ------------------------------------------------------------- pieces */

function NavButton({
	label,
	onClick,
	disabled,
	dir,
}: {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	dir: 'prev' | 'next';
}) {
	return (
		<button
			type="button"
			aria-label={label}
			onClick={onClick}
			disabled={disabled}
			className="flex h-9 w-9 items-center justify-center border border-[var(--color-line-strong)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--color-line-strong)] disabled:hover:text-[var(--color-ink)]"
		>
			<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
				<path d={dir === 'prev' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} strokeLinecap="square" />
			</svg>
		</button>
	);
}

interface MonthGridProps {
	month: string;
	hideOnMobile: boolean;
	uid: string;
	tabStop: string;
	stateFor: (d: string) => DayState;
	onSelect: (d: string) => void;
	onHover: (d: string | null) => void;
	onKeyDown: (e: KeyboardEvent<HTMLButtonElement>, d: string) => void;
	onFocusDay: (d: string) => void;
	reduce: boolean;
}

function MonthGrid({ month, hideOnMobile, uid, tabStop, stateFor, onSelect, onHover, onKeyDown, onFocusDay, reduce }: MonthGridProps) {
	const weeks = useMemo(() => monthGrid(month), [month]);
	const labelId = `${uid}-${month}`;
	return (
		<div className={clsx(hideOnMobile && 'hidden md:block')}>
			<p id={labelId} className="heading-display mb-4 text-sm tracking-[0.08em] text-[var(--color-ink)]">
				{MONTH_FMT.format(toUtcDate(month))}
			</p>
			<div role="grid" aria-labelledby={labelId} className="w-full">
				<div role="row" className="grid grid-cols-7">
					{WEEKDAYS.map((w) => (
						<span
							key={w}
							role="columnheader"
							aria-label={w}
							className="pb-2 text-center text-[0.62rem] uppercase tracking-[0.2em] text-[var(--color-ink-dim)]"
						>
							{w}
						</span>
					))}
				</div>
				{weeks.map((week, wi) => (
					<div role="row" key={wi} className="grid grid-cols-7">
						{week.map((d, di) =>
							d ? (
								<DayCell
									key={d}
									date={d}
									state={stateFor(d)}
									tabbable={d === tabStop}
									uid={uid}
									onSelect={onSelect}
									onHover={onHover}
									onKeyDown={onKeyDown}
									onFocusDay={onFocusDay}
									reduce={reduce}
									col={di}
								/>
							) : (
								<span key={`pad-${wi}-${di}`} role="gridcell" aria-hidden className="aspect-square" />
							),
						)}
					</div>
				))}
			</div>
		</div>
	);
}

interface DayCellProps {
	date: string;
	state: DayState;
	tabbable: boolean;
	uid: string;
	col: number;
	onSelect: (d: string) => void;
	onHover: (d: string | null) => void;
	onKeyDown: (e: KeyboardEvent<HTMLButtonElement>, d: string) => void;
	onFocusDay: (d: string) => void;
	reduce: boolean;
}

const DayCell = memo(function DayCell({
	date,
	state,
	tabbable,
	uid,
	col,
	onSelect,
	onHover,
	onKeyDown,
	onFocusDay,
	reduce,
}: DayCellProps) {
	const { disabled, struck, isStart, isEnd, inRange, inPreview, isPreviewEnd, joinRight, joinLeft, rangeCommitted, isToday } = state;
	const isCap = isStart || isEnd;
	const selected = isCap || inRange;
	const label = `${DAY_LABEL_FMT.format(toUtcDate(date))}${struck ? ', booked' : ''}${isStart ? ', pick-up' : ''}${isEnd ? ', return' : ''}`;
	const fillTransition = reduce ? NO_TRANSITION : { ...FILL_TRANSITION, delay: Math.min(col * 0.025, 0.15) };

	return (
		<div role="gridcell" aria-selected={selected} className="relative aspect-square p-[1px]">
			{/* Range band, animated fill from the left. Caps get a half band joining the range. */}
			{inRange || inPreview ? (
				<motion.span
					aria-hidden
					className={clsx('absolute inset-x-0 inset-y-[3px] origin-left', inRange ? 'bg-[var(--color-tint-strong)]' : 'bg-[var(--color-tint)]')}
					initial={reduce ? false : FILL_INITIAL}
					animate={FILL_ANIMATE}
					transition={fillTransition}
				/>
			) : null}
			{joinRight ? (
				<motion.span
					aria-hidden
					className={clsx('absolute inset-y-[3px] left-1/2 right-0 origin-left', rangeCommitted ? 'bg-[var(--color-tint-strong)]' : 'bg-[var(--color-tint)]')}
					initial={reduce ? false : FILL_INITIAL}
					animate={FILL_ANIMATE}
					transition={fillTransition}
				/>
			) : null}
			{joinLeft ? (
				<motion.span
					aria-hidden
					className={clsx('absolute inset-y-[3px] left-0 right-1/2 origin-left', isEnd ? 'bg-[var(--color-tint-strong)]' : 'bg-[var(--color-tint)]')}
					initial={reduce ? false : FILL_INITIAL}
					animate={FILL_ANIMATE}
					transition={fillTransition}
				/>
			) : null}
			{isCap ? (
				<motion.span
					aria-hidden
					layoutId={reduce ? undefined : `${uid}-${isStart ? 'start' : 'end'}`}
					className="absolute inset-[3px] bg-[var(--color-primary)]"
					transition={reduce ? NO_TRANSITION : CAP_TRANSITION}
				/>
			) : isPreviewEnd ? (
				<span aria-hidden className="absolute inset-[3px] border border-[var(--color-primary)] bg-[var(--color-bg)]" />
			) : null}
			<button
				type="button"
				data-date={date}
				tabIndex={tabbable ? 0 : -1}
				aria-label={label}
				aria-disabled={disabled || undefined}
				onClick={() => onSelect(date)}
				onMouseEnter={() => onHover(date)}
				onFocus={() => {
					onFocusDay(date);
					onHover(date);
				}}
				onKeyDown={(e) => onKeyDown(e, date)}
				className={clsx(
					'tabular relative z-[1] flex h-full w-full items-center justify-center text-[0.8rem] outline-none transition-colors duration-200',
					'focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]',
					isCap
						? 'font-medium text-black'
						: disabled
							? 'cursor-not-allowed text-[var(--color-ink-dim)]'
							: inRange || inPreview
								? 'text-[var(--color-primary-bright)] hover:text-[var(--color-ink)]'
								: 'text-[var(--color-ink)] hover:bg-[var(--color-surface-3)]',
					struck && !isCap && 'line-through decoration-[var(--color-ink-dim)] decoration-1',
				)}
			>
				{Number(date.slice(8))}
				{isToday && !isCap ? (
					<span aria-hidden className="absolute bottom-[18%] left-1/2 h-[3px] w-[3px] -translate-x-1/2 bg-[var(--color-primary)]" />
				) : null}
			</button>
		</div>
	);
});

