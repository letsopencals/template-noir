'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface HorizontalDayStripProps {
	selectedDate: string | null;
	onDateSelect: (date: string) => void;
	/** Store timezone for "today" (defaults to Asia/Dubai via the caller). */
	timezone?: string;
}

const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
const MONTH_YEAR = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** YYYY-MM-DD plus n days (UTC calendar maths). */
function plusDays(date: string, n: number): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

/** Squared day chips, from today in the store timezone. "Later" extends the strip. */
export function HorizontalDayStrip({ selectedDate, onDateSelect, timezone = 'Asia/Dubai' }: HorizontalDayStripProps) {
	const today = useMemo(() => new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date()), [timezone]);
	const [windowSize, setWindowSize] = useState(21);
	const scrollRef = useRef<HTMLDivElement>(null);

	const days = useMemo(() => Array.from({ length: windowSize }, (_, i) => plusDays(today, i)), [today, windowSize]);

	// Keep the selected chip in view (scroll the strip only, not the page).
	useEffect(() => {
		const list = scrollRef.current;
		const el = selectedDate ? list?.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`) : null;
		if (!list || !el) return;
		list.scrollTo({ left: el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
	}, [selectedDate]);

	const header = MONTH_YEAR.format(new Date(`${selectedDate ?? today}T00:00:00Z`));

	return (
		<div>
			<div className="mb-4 flex items-baseline justify-between">
				<p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)]">{header}</p>
				<button
					type="button"
					onClick={() => setWindowSize((n) => n + 14)}
					className="link-underline text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-primary)]"
				>
					Later dates
				</button>
			</div>

			<div
				ref={scrollRef}
				data-lenis-prevent
				role="listbox"
				aria-label="Choose a day"
				className="no-scrollbar relative -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
			>
				{days.map((date, i) => {
					const d = new Date(`${date}T00:00:00Z`);
					const isSelected = date === selectedDate;
					const firstOfMonth = d.getUTCDate() === 1;
					return (
						<button
							key={date}
							type="button"
							role="option"
							aria-selected={isSelected}
							data-date={date}
							onClick={() => onDateSelect(date)}
							className={clsx(
								'flex min-w-[60px] shrink-0 flex-col items-center border px-3 py-3 transition-colors duration-300',
								isSelected
									? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-black'
									: 'border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary-dark)]',
							)}
						>
							<span className={clsx('text-[0.58rem] uppercase tracking-[0.2em]', isSelected ? 'text-black/70' : 'text-[var(--color-ink-dim)]')}>
								{i === 0 ? 'Today' : WEEKDAY.format(d)}
							</span>
							<span className="tabular mt-1 text-xl leading-none">{d.getUTCDate()}</span>
							<span className={clsx('mt-1 text-[0.55rem] uppercase tracking-[0.18em]', isSelected ? 'text-black/60' : 'text-[var(--color-ink-dim)]')}>
								{firstOfMonth || i === 0 ? MONTH.format(d) : ' '}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
