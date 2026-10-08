'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnimatePresence, LayoutGroup, motion, type Variants } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { rentalDays, todayIn } from '@/lib/rental';
import { siteConfig } from '@/lib/site-config';
import { DURATION, EASE_OUT } from '@/components/motion/easing';
import { FleetCard } from './fleet-card';
import { Listbox } from '@/components/ui/listbox';
import { FleetDateFilter } from './fleet-date-filter';
import { useFleetAvailability } from './use-fleet-availability';
import { parseDateParam, type CarCardData } from './fleet-data';

export interface FleetCategoryOption {
	slug: string;
	label: string;
	count: number;
}

export interface FleetBrowserProps {
	cars: CarCardData[];
	categories: FleetCategoryOption[];
}

type SortKey = 'price-desc' | 'price-asc';

const SORTS: ReadonlyArray<{ key: SortKey; label: string }> = [
	{ key: 'price-desc', label: 'Price, high to low' },
	{ key: 'price-asc', label: 'Price, low to high' },
];
const SORT_OPTIONS = SORTS.map((s) => ({ value: s.key, label: s.label }));
const SORT_FIELD =
	'h-11 rounded-[2px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] [color-scheme:dark] focus:border-[var(--color-primary)] focus:outline-none';

const ITEM: Variants = {
	hidden: { opacity: 0, y: 24, scale: 0.98 },
	visible: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.base, ease: EASE_OUT } },
	exit: { opacity: 0, scale: 0.96, transition: { duration: DURATION.fast, ease: EASE_OUT } },
};
const ITEM_REDUCED: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: DURATION.fast } },
	exit: { opacity: 0, transition: { duration: DURATION.fast } },
};
const LAYOUT_TRANSITION = { layout: { duration: DURATION.base, ease: EASE_OUT } } as const;
const CHIP_TRANSITION = { type: 'spring', stiffness: 380, damping: 34 } as const;

/** 12-col rhythm: wide, narrow / narrow, wide — repeated. */
const SPANS = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7'] as const;

function spanFor(index: number, total: number): { className: string; large: boolean } {
	// A lone card in the last row takes the full width.
	if (index === total - 1 && index % 2 === 0) return { className: 'md:col-span-2 lg:col-span-12', large: true };
	const pattern = index % 4;
	return { className: SPANS[pattern]!, large: pattern === 0 || pattern === 3 };
}

function formatShort(date: string): string {
	return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/**
 * The /fleet browser: category chips, price sort and "available for your
 * dates", all mirrored to the URL (`?category=&sort=&from=&until=`) so a
 * filtered view can be shared or arrived at from the home quick bar.
 */
export function FleetBrowser({ cars, categories }: FleetBrowserProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const reduce = useReducedMotion();
	const [showBooked, setShowBooked] = useState(false);

	const today = useMemo(() => todayIn(siteConfig.timezone), []);
	const category = searchParams.get('category');
	const activeCategory = categories.some((c) => c.slug === category) ? category : null;
	const sort: SortKey = searchParams.get('sort') === 'price-asc' ? 'price-asc' : 'price-desc';
	const rawFrom = parseDateParam(searchParams.get('from'));
	const rawUntil = parseDateParam(searchParams.get('until'));
	const from = rawFrom && rawFrom >= today ? rawFrom : null;
	const until = from && rawUntil && rentalDays(from, rawUntil) >= 1 ? rawUntil : null;

	const setParams = useCallback(
		(patch: Record<string, string | null>) => {
			const next = new URLSearchParams(searchParams.toString());
			for (const [k, v] of Object.entries(patch)) {
				if (v) next.set(k, v);
				else next.delete(k);
			}
			const qs = next.toString();
			// Native history update: Next syncs useSearchParams without a server round trip.
			window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
		},
		[pathname, searchParams],
	);

	const onDates = useCallback(
		(v: { from: string | null; until: string | null }) => {
			setShowBooked(false);
			setParams({ from: v.from, until: v.until });
		},
		[setParams],
	);

	const onSort = useCallback((v: string) => setParams({ sort: v === 'price-asc' ? 'price-asc' : null }), [setParams]);

	const slugs = useMemo(() => cars.map((c) => c.slug), [cars]);
	const { availability, isLoading, error } = useFleetAvailability(slugs, from, until);

	const inCategory = useMemo(() => {
		const list = activeCategory ? cars.filter((c) => c.category === activeCategory) : cars.slice();
		list.sort((a, b) => (sort === 'price-asc' ? a.pricePerDay - b.pricePerDay : b.pricePerDay - a.pricePerDay));
		return list;
	}, [cars, activeCategory, sort]);

	const bookedCount = availability ? inCategory.filter((c) => availability[c.slug] === false).length : 0;
	const visible = useMemo(
		() => (availability && !showBooked ? inCategory.filter((c) => availability[c.slug] !== false) : inCategory),
		[availability, inCategory, showBooked],
	);

	const datesSet = Boolean(from && until);
	const days = from && until ? rentalDays(from, until) : 0;

	return (
		<div className="mx-auto max-w-[1400px] px-6 pb-[var(--spacing-section-sm)] lg:px-10">
			{/* Controls */}
			<div className="-mx-6 mb-10 border-y border-[var(--color-line)] bg-[rgba(5,5,5,0.86)] px-6 py-5 backdrop-blur-xl lg:sticky lg:top-20 lg:z-30 lg:-mx-10 lg:px-10">
				<div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
					<LayoutGroup id="fleet-chips">
						<div role="group" aria-label="Category" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
							<CategoryChip label="All" count={cars.length} active={!activeCategory} onClick={() => setParams({ category: null })} />
							{categories.map((c) => (
								<CategoryChip
									key={c.slug}
									label={c.label}
									count={c.count}
									active={activeCategory === c.slug}
									onClick={() => setParams({ category: c.slug })}
								/>
							))}
						</div>
					</LayoutGroup>

					<div className="flex flex-col gap-4 sm:flex-row sm:items-end">
						<FleetDateFilter from={from} until={until} minDate={today} onChange={onDates} className="flex-1" />
						<div className="flex flex-col gap-2">
							<label htmlFor="fleet-sort" className="eyebrow">
								Sort
							</label>
							<select
								id="fleet-sort"
								value={sort}
								onChange={(e) => onSort(e.target.value)}
								className={clsx(SORT_FIELD, 'pointer-fine:hidden')}
							>
								{SORTS.map((s) => (
									<option key={s.key} value={s.key}>
										{s.label}
									</option>
								))}
							</select>
							<span className="hidden min-w-[13rem] pointer-fine:block">
								<Listbox
									label="Sort"
									value={sort}
									options={SORT_OPTIONS}
									onChange={onSort}
									align="end"
									className={clsx(SORT_FIELD, 'cursor-pointer transition-colors hover:border-[var(--color-ink-dim)] aria-expanded:border-[var(--color-primary)]')}
								/>
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Status line */}
			<div className="mb-8 flex min-h-6 flex-wrap items-center justify-between gap-4 text-sm text-[var(--color-ink-muted)]" aria-live="polite">
				<p>
					<span className="tabular text-[var(--color-ink)]">{visible.length}</span> {visible.length === 1 ? 'car' : 'cars'}
					{datesSet ? (
						<>
							{' '}
							free from <span className="tabular text-[var(--color-ink)]">{formatShort(from!)}</span> to{' '}
							<span className="tabular text-[var(--color-ink)]">{formatShort(until!)}</span>
							<span className="tabular"> · {days} {days === 1 ? 'day' : 'days'}</span>
						</>
					) : null}
				</p>
				{isLoading ? (
					<span className="inline-flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.22em]">
						<span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-primary)]" />
						Checking availability
					</span>
				) : error ? (
					<span>Availability could not be checked. Showing every car.</span>
				) : bookedCount > 0 ? (
					<button
						type="button"
						onClick={() => setShowBooked((v) => !v)}
						className="link-underline text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
					>
						{showBooked ? 'Hide booked cars' : `Show ${bookedCount} booked ${bookedCount === 1 ? 'car' : 'cars'}`}
					</button>
				) : null}
			</div>

			{/* Grid */}
			{visible.length > 0 ? (
				<motion.ul layout={!reduce} className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12 lg:gap-6">
					<AnimatePresence mode="popLayout" initial={false}>
						{visible.map((car, i) => {
							const span = spanFor(i, visible.length);
							return (
								<motion.li
									key={car.slug}
									layout={!reduce}
									variants={reduce ? ITEM_REDUCED : ITEM}
									initial="hidden"
									animate="visible"
									exit="exit"
									transition={LAYOUT_TRANSITION}
									className={span.className}
								>
									<FleetCard
										car={car}
										size={span.large ? 'large' : 'small'}
										from={from}
										until={until}
										available={datesSet ? (availability?.[car.slug] ?? null) : undefined}
										index={i}
										priority={i < 2}
									/>
								</motion.li>
							);
						})}
					</AnimatePresence>
				</motion.ul>
			) : (
				<EmptyState datesSet={datesSet} onClear={() => onDates({ from: null, until: null })} onShowAll={() => setParams({ category: null })} />
			)}
		</div>
	);
}

function CategoryChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={clsx(
				'relative inline-flex h-10 shrink-0 items-center gap-2.5 rounded-[2px] border px-4 text-[0.68rem] font-medium uppercase tracking-[0.22em] transition-colors duration-300',
				active
					? 'border-transparent text-black'
					: 'border-[var(--color-line-strong)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink-dim)] hover:text-[var(--color-ink)]',
			)}
		>
			{active ? (
				<motion.span layoutId="fleet-chip-fill" transition={CHIP_TRANSITION} className="absolute inset-0 rounded-[2px] bg-[var(--color-primary)]" />
			) : null}
			<span className="relative">{label}</span>
			<span className={clsx('tabular relative text-[0.62rem]', active ? 'text-black/60' : 'text-[var(--color-ink-dim)]')}>{count}</span>
		</button>
	);
}

function EmptyState({ datesSet, onClear, onShowAll }: { datesSet: boolean; onClear: () => void; onShowAll: () => void }) {
	return (
		<div className="flex flex-col items-start gap-6 border border-[var(--color-line)] bg-[var(--color-surface)] p-10 lg:p-16">
			<p className="heading-display text-2xl text-[var(--color-ink)] lg:text-4xl">Nothing free in this class</p>
			<p className="max-w-lg text-[var(--color-ink-muted)]">
				{datesSet
					? 'Every car here is out on those dates. Try a day either side, another category, or message the concierge and we will find the closest match.'
					: 'No cars in this category right now.'}
			</p>
			<div className="flex flex-wrap gap-5">
				{datesSet ? (
					<button type="button" onClick={onClear} className="link-underline text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-primary)]">
						Clear dates
					</button>
				) : null}
				<button type="button" onClick={onShowAll} className="link-underline text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
					All categories
				</button>
				<a
					href={siteConfig.contact.whatsappHref}
					target="_blank"
					rel="noreferrer"
					className="link-underline text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]"
				>
					WhatsApp the concierge
				</a>
			</div>
		</div>
	);
}
