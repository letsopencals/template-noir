'use client';

import { memo, useCallback, useId, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { addDays, rentalDays } from '@/lib/rental';
import { siteConfig } from '@/lib/site-config';
import { DateRangePopover, type RangeField } from '@/components/rental/date-range-popover';
import type { RangeValue } from '@/components/rental/range-calendar';

export interface FleetDateFilterProps {
	from: string | null;
	until: string | null;
	/** Today in the store timezone (the earliest pick-up). */
	minDate: string;
	onChange: (value: { from: string | null; until: string | null }) => void;
	className?: string;
}

const FIELD =
	'tabular h-11 w-full min-w-0 rounded-[2px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] [color-scheme:dark] transition-colors hover:border-[var(--color-ink-dim)] focus:border-[var(--color-primary)] focus:outline-none';
const NATIVE = clsx(FIELD, 'pointer-fine:hidden');
const TRIGGER = clsx(FIELD, 'hidden cursor-pointer items-center justify-between gap-3 text-left pointer-fine:flex');
const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

const CALENDAR_ICON = (
	<svg aria-hidden className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-dim)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
		<rect x="2" y="3" width="12" height="11" />
		<path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
	</svg>
);

/**
 * Compact pick-up / return control for the fleet filter. Touch devices get
 * native date inputs (the OS picker); pointer devices get two triggers that
 * open the branded `DateRangePopover`. Moving pick-up past return nudges
 * return to the next day.
 */
export const FleetDateFilter = memo(function FleetDateFilter({ from, until, minDate, onChange, className }: FleetDateFilterProps) {
	const id = useId();
	const panelId = `${id}-dates`;
	const anchorRef = useRef<HTMLFieldSetElement>(null);
	const [picker, setPicker] = useState<RangeField | null>(null);
	const days = from && until ? rentalDays(from, until) : 0;
	const closePicker = useCallback(() => setPicker(null), []);
	const onRange = useCallback((v: RangeValue) => onChange({ from: v.from, until: v.until }), [onChange]);

	const trigger = (field: RangeField, date: string | null, label: string) => (
		<button
			type="button"
			data-panel-for={panelId}
			aria-haspopup="dialog"
			aria-expanded={picker !== null}
			aria-controls={picker !== null ? panelId : undefined}
			aria-label={`${label}${date ? `: ${SHORT_DATE.format(new Date(`${date}T00:00:00Z`))}` : ''}`}
			onClick={() => setPicker((p) => (p === field ? null : field))}
			className={clsx(TRIGGER, picker === field && 'border-[var(--color-primary)]')}
		>
			{date ? SHORT_DATE.format(new Date(`${date}T00:00:00Z`)) : <span className="text-[var(--color-ink-dim)]">Add date</span>}
			{CALENDAR_ICON}
		</button>
	);

	return (
		<fieldset ref={anchorRef} className={clsx('flex flex-wrap items-end gap-3', className)}>
			<legend className="sr-only">Available for your dates</legend>
			<div className="flex min-w-[9.5rem] flex-1 flex-col gap-2">
				<label htmlFor={`${id}-from`} className="eyebrow">
					Pick-up
				</label>
				<input
					id={`${id}-from`}
					type="date"
					className={NATIVE}
					min={minDate}
					value={from ?? ''}
					onChange={(e) => {
						const next = e.target.value || null;
						const keepUntil = next && until && rentalDays(next, until) >= 1 ? until : next ? addDays(next, 1) : until;
						onChange({ from: next, until: keepUntil });
					}}
				/>
				{trigger('from', from, 'Pick-up date')}
			</div>
			<div className="flex min-w-[9.5rem] flex-1 flex-col gap-2">
				<label htmlFor={`${id}-until`} className="eyebrow">
					Return
				</label>
				<input
					id={`${id}-until`}
					type="date"
					className={NATIVE}
					min={from ? addDays(from, 1) : addDays(minDate, 1)}
					value={until ?? ''}
					onChange={(e) => onChange({ from, until: e.target.value || null })}
				/>
				{trigger('until', until, 'Return date')}
			</div>
			<div className="flex h-11 items-center gap-4">
				<span className="tabular text-sm text-[var(--color-ink-muted)]" aria-live="polite">
					{days >= 1 ? `${days} ${days === 1 ? 'day' : 'days'}` : '—'}
				</span>
				{from || until ? (
					<button
						type="button"
						onClick={() => onChange({ from: null, until: null })}
						className="link-underline text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
					>
						Clear
					</button>
				) : null}
			</div>
			<DateRangePopover
				open={picker !== null}
				field={picker ?? 'from'}
				anchorRef={anchorRef}
				onClose={closePicker}
				value={{ from, until }}
				onChange={onRange}
				timezone={siteConfig.timezone}
				minDate={minDate}
				align="end"
				id={panelId}
			/>
		</fieldset>
	);
});
