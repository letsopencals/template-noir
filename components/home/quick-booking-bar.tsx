'use client';

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { Button } from '@/components/ui/button';
import { Listbox, type ListboxOption } from '@/components/ui/listbox';
import { SafeImage } from '@/components/ui/safe-image';
import { DateRangePopover, type RangeField } from '@/components/rental/date-range-popover';
import type { RangeValue } from '@/components/rental/range-calendar';
import { formatWholePrice } from '@/components/marketing/format';
import type { HomeCar } from './types';

export type QuickBookingMode = 'delivery' | 'garage';

export interface QuickBookingBarProps {
	/** Cars for the car picker. */
	cars: ReadonlyArray<Pick<HomeCar, 'slug' | 'title' | 'image' | 'categoryLabel' | 'pricePerDay' | 'currency'>>;
	className?: string;
}

const DAY_MS = 86_400_000;

/** Today's calendar date ('YYYY-MM-DD') in the store timezone. */
function todayIn(timeZone: string): string {
	// en-CA formats as YYYY-MM-DD.
	return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function addDays(date: string, n: number): string {
	const t = Date.parse(`${date}T12:00:00Z`);
	if (!Number.isFinite(t)) return '';
	return new Date(t + n * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(from: string, until: string): number {
	const a = Date.parse(`${from}T12:00:00Z`);
	const b = Date.parse(`${until}T12:00:00Z`);
	if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
	return Math.max(0, Math.round((b - a) / DAY_MS));
}

const FIELD = 'flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:py-0';
const LABEL = 'text-[0.6rem] font-medium uppercase tracking-[0.28em] text-[var(--color-ink-dim)]';
const CONTROL =
	'w-full min-w-0 appearance-none bg-transparent text-[0.95rem] text-[var(--color-ink)] outline-none [color-scheme:dark] focus-visible:text-[var(--color-primary-bright)]';
const DATE_CONTROL = clsx(
	CONTROL,
	'tabular pointer-fine:hidden [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100',
);
/** Desktop trigger: its ::after covers the whole cell, so the label area opens the picker too. */
const PICKER_TRIGGER = clsx(
	CONTROL,
	'tabular hidden cursor-pointer text-left after:absolute after:inset-0 after:content-[""] pointer-fine:block',
);
const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

function formatDay(date: string): string {
	return SHORT_DATE.format(new Date(`${date}T00:00:00Z`));
}

const ANY_CAR_ICON = (
	<span aria-hidden className="flex h-9 w-16 shrink-0 items-center justify-center border border-[var(--color-line)] text-[var(--color-ink-muted)]">
		<svg className="h-4 w-8" viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth="1.1">
			<path d="M2 11.5h28M4 11.5V9.2l3.5-1.4L11 4.5h8.5l5 3.3 4 .9 1.5 1.3v1.5" />
			<circle cx="9" cy="12" r="2" />
			<circle cx="24" cy="12" r="2" />
		</svg>
	</span>
);

function CarThumb({ src, alt }: { src: string | null; alt: string }) {
	return (
		<span className="image-placeholder relative h-9 w-16 shrink-0 overflow-hidden">
			<SafeImage src={src} alt={alt} fill sizes="64px" className="object-contain" />
		</span>
	);
}

/**
 * The hero's quick booking bar: car · pick-up · return · deliver / collect.
 * Submits to `/book?car=<slug>&from=YYYY-MM-DD&until=YYYY-MM-DD&mode=delivery|garage`
 * (client navigation; it is also a plain GET form, so it works without JS).
 * Dates are calendar days in `siteConfig.timezone`; empty fields are omitted.
 */
export const QuickBookingBar = memo(function QuickBookingBar({ cars, className }: QuickBookingBarProps) {
	const router = useRouter();
	const copy = siteConfig.marketing.quickBar;
	const [car, setCar] = useState('');
	const [from, setFrom] = useState('');
	const [until, setUntil] = useState('');
	const [mode, setMode] = useState<QuickBookingMode>('delivery');
	// Computed after mount so the server render and hydration agree.
	const [today, setToday] = useState('');
	const [picker, setPicker] = useState<RangeField | null>(null);
	const pickupRef = useRef<HTMLDivElement>(null);
	const uid = useId();
	const panelId = `${uid}-dates`;

	const carOptions = useMemo<ListboxOption[]>(
		() => [
			{ value: '', label: copy.anyCar, description: 'Search the whole fleet', leading: ANY_CAR_ICON },
			...cars.map((c) => ({
				value: c.slug,
				label: c.title,
				description: c.categoryLabel,
				leading: <CarThumb src={c.image} alt="" />,
				trailing:
					c.pricePerDay !== null ? (
						<span className="tabular shrink-0 text-[0.78rem] text-[var(--color-ink-muted)]">
							{formatWholePrice(c.pricePerDay, c.currency)}
							<span className="text-[var(--color-ink-dim)]"> /day</span>
						</span>
					) : null,
			})),
		],
		[cars, copy.anyCar],
	);

	const closePicker = useCallback(() => setPicker(null), []);
	const onRange = useCallback((v: RangeValue) => {
		setFrom(v.from ?? '');
		setUntil(v.until ?? '');
	}, []);

	useEffect(() => {
		setToday(todayIn(siteConfig.timezone));
	}, []);

	const onFromChange = useCallback(
		(value: string) => {
			setFrom(value);
			if (value && (!until || until <= value)) setUntil(addDays(value, 1));
		},
		[until],
	);

	const onSubmit = useCallback(
		(e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const params = new URLSearchParams();
			if (car) params.set('car', car);
			if (from && until && until > from) {
				params.set('from', from);
				params.set('until', until);
			}
			params.set('mode', mode);
			router.push(`/book?${params.toString()}`);
		},
		[car, from, until, mode, router],
	);

	const days = from && until ? daysBetween(from, until) : 0;
	const untilMin = from ? addDays(from, 1) : today ? addDays(today, 1) : undefined;

	return (
		<form
			action="/book"
			method="get"
			onSubmit={onSubmit}
			aria-label={copy.eyebrow}
			className={clsx(
				'glass-strong grid grid-cols-2 divide-[var(--color-line)] rounded-[2px] lg:h-[88px] lg:grid-cols-[1.35fr_1fr_1fr_1.45fr_auto] lg:divide-x',
				className,
			)}
		>
			<div className={clsx(FIELD, 'col-span-2 border-b border-[var(--color-line)] lg:col-span-1 lg:border-b-0')}>
				<label htmlFor={`${uid}-car`} className={LABEL}>
					Car
				</label>
				{/* Touch: native select. Pointer: branded list with thumbnails. */}
				<span className="relative flex items-center pointer-fine:hidden">
					<select id={`${uid}-car`} name="car" value={car} onChange={(e) => setCar(e.target.value)} className={clsx(CONTROL, 'cursor-pointer truncate pr-6')}>
						<option value="">{copy.anyCar}</option>
						{cars.map((c) => (
							<option key={c.slug} value={c.slug}>
								{c.title}
							</option>
						))}
					</select>
					<svg aria-hidden className="pointer-events-none absolute right-0 h-3 w-3 text-[var(--color-ink-muted)]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
						<path d="M2 4.5 6 8l4-3.5" />
					</svg>
				</span>
				<span className="hidden pointer-fine:block">
					<Listbox label="Car" value={car} options={carOptions} onChange={setCar} panelWidth={420} className={clsx(CONTROL, 'cursor-pointer')} />
				</span>
			</div>

			<div ref={pickupRef} className={clsx(FIELD, 'relative border-b border-r border-[var(--color-line)] lg:border-b-0')}>
				<label htmlFor={`${uid}-from`} className={LABEL}>
					Pick-up
				</label>
				<input
					id={`${uid}-from`}
					type="date"
					name="from"
					value={from}
					min={today || undefined}
					onChange={(e) => onFromChange(e.target.value)}
					className={DATE_CONTROL}
				/>
				<button
					type="button"
					data-panel-for={panelId}
					aria-haspopup="dialog"
					aria-expanded={picker !== null}
					aria-controls={picker !== null ? panelId : undefined}
					aria-label={`Pick-up date${from ? `: ${formatDay(from)}` : ''}`}
					onClick={() => setPicker((p) => (p === 'from' ? null : 'from'))}
					className={clsx(PICKER_TRIGGER, picker === 'from' && 'text-[var(--color-primary-bright)]')}
				>
					{from ? formatDay(from) : <span className="text-[var(--color-ink-dim)]">Add date</span>}
				</button>
			</div>

			<div className={clsx(FIELD, 'relative border-b border-[var(--color-line)] lg:border-b-0')}>
				<label htmlFor={`${uid}-until`} className={LABEL}>
					Return
					{days > 0 ? (
						<span className="tabular ml-2 tracking-[0.12em] text-[var(--color-primary)]">
							{days} {days === 1 ? 'day' : 'days'}
						</span>
					) : null}
				</label>
				<input
					id={`${uid}-until`}
					type="date"
					name="until"
					value={until}
					min={untilMin}
					onChange={(e) => setUntil(e.target.value)}
					className={DATE_CONTROL}
				/>
				<button
					type="button"
					data-panel-for={panelId}
					aria-haspopup="dialog"
					aria-expanded={picker !== null}
					aria-controls={picker !== null ? panelId : undefined}
					aria-label={`Return date${until ? `: ${formatDay(until)}` : ''}`}
					onClick={() => setPicker((p) => (p === 'until' ? null : 'until'))}
					className={clsx(PICKER_TRIGGER, picker === 'until' && 'text-[var(--color-primary-bright)]')}
				>
					{until ? formatDay(until) : <span className="text-[var(--color-ink-dim)]">Add date</span>}
				</button>
			</div>

			<DateRangePopover
				open={picker !== null}
				field={picker ?? 'from'}
				anchorRef={pickupRef}
				onClose={closePicker}
				value={{ from: from || null, until: until || null }}
				onChange={onRange}
				timezone={siteConfig.timezone}
				id={panelId}
			/>

			<fieldset className={clsx(FIELD, 'col-span-2 border-b border-[var(--color-line)] lg:col-span-1 lg:border-b-0')}>
				<legend className="sr-only">Delivery or collection</legend>
				<span aria-hidden className={LABEL}>
					Handover
				</span>
				<div className="grid grid-cols-2 gap-1.5">
					{copy.modes.map((m) => {
						const checked = mode === m.key;
						return (
							<label
								key={m.key}
								className={clsx(
									'relative flex h-9 cursor-pointer items-center justify-center rounded-[2px] border px-2 text-center text-[0.62rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-[var(--color-primary)]',
									checked
										? 'border-[var(--color-primary)] bg-[var(--color-tint)] text-[var(--color-primary-bright)]'
										: 'border-[var(--color-line)] text-[var(--color-ink-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]',
								)}
							>
								<input
									type="radio"
									name="mode"
									value={m.key}
									checked={checked}
									onChange={() => setMode(m.key as QuickBookingMode)}
									className="sr-only"
								/>
								{m.label}
							</label>
						);
					})}
				</div>
			</fieldset>

			<div className="col-span-2 p-3 lg:col-span-1 lg:flex lg:items-center lg:p-3">
				<Button type="submit" size="lg" fullWidth className="lg:h-full lg:px-8">
					{copy.cta}
					<svg aria-hidden className="h-3 w-4 transition-transform duration-500 group-hover/btn:translate-x-1" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.3">
						<path d="M0 6h14M9.5 1.5 14 6l-4.5 4.5" />
					</svg>
				</Button>
			</div>
		</form>
	);
});
