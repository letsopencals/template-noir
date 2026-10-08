'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { FloatingPanel } from '@/components/ui/floating-panel';
import { addDays, todayIn, type AvailabilityRange } from '@/lib/rental';
import { RangeCalendar, type RangeValue } from './range-calendar';

export type RangeField = 'from' | 'until';

export interface DateRangePopoverProps {
	open: boolean;
	anchorRef: RefObject<HTMLElement | null>;
	onClose(): void;
	value: RangeValue;
	/** Called once with a complete range (both dates), or with nulls on Clear. */
	onChange(value: RangeValue): void;
	/** Which field opened the picker: 'until' keeps the pick-up and asks for the return. */
	field: RangeField;
	timezone: string;
	/** Earliest pick-up. Default today in `timezone`. */
	minDate?: string;
	maxDays?: number;
	align?: 'start' | 'end';
	id?: string;
}

/** Delay before closing, so the return cap's animation is seen landing. */
const CLOSE_DELAY_MS = 320;

/** One open-ended free range: with no car chosen, every day from today is bookable. */
function openRange(today: string): AvailabilityRange[] {
	return [{ fromDate: addDays(today, -1), fromTime: '00:00:00', toDate: addDays(today, 400), toTime: '00:00:00' }];
}

/**
 * Desktop pick-up / return picker for car-agnostic searches (home quick bar,
 * fleet filter): the branded `RangeCalendar` in a `FloatingPanel`. Edits a
 * draft and commits only a complete range, so closing halfway keeps the old
 * dates. Touch devices keep native date inputs (see callers).
 */
export function DateRangePopover({
	open,
	anchorRef,
	onClose,
	value,
	onChange,
	field,
	timezone,
	minDate,
	maxDays = 30,
	align = 'start',
	id,
}: DateRangePopoverProps) {
	const today = useMemo(() => todayIn(timezone), [timezone]);
	const ranges = useMemo(() => openRange(today), [today]);
	const [draft, setDraft] = useState<RangeValue>(value);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Fresh draft on every open, and when the other field's trigger is clicked.
	useEffect(() => {
		if (!open) return;
		setDraft(field === 'until' && value.from ? { from: value.from, until: null } : value);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, field]);

	useEffect(() => () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
	}, []);

	const onDraft = useCallback(
		(next: RangeValue) => {
			setDraft(next);
			if (next.from && next.until) {
				onChange(next);
				closeTimer.current = setTimeout(onClose, CLOSE_DELAY_MS);
			}
		},
		[onChange, onClose],
	);

	const clear = useCallback(() => {
		setDraft({ from: null, until: null });
		onChange({ from: null, until: null });
	}, [onChange]);

	return (
		<FloatingPanel
			open={open}
			anchorRef={anchorRef}
			onClose={onClose}
			width={680}
			align={align}
			id={id}
			role="dialog"
			aria-label="Choose pick-up and return dates"
			className="p-6"
			initialFocus='[data-date][tabindex="0"]'
		>
			<RangeCalendar
				ranges={ranges}
				timezone={timezone}
				value={draft}
				onChange={onDraft}
				maxDays={maxDays}
				minDate={minDate}
				showLegend={false}
			/>
			<div className="mt-6 flex items-center justify-between border-t border-[var(--color-line)] pt-4 text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">
				<span>Up to {maxDays} days online · Handover time on the next step</span>
				{value.from || value.until ? (
					<button type="button" onClick={clear} className="link-underline text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
						Clear dates
					</button>
				) : null}
			</div>
		</FloatingPanel>
	);
}
