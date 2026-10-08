'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { RangeCalendar, type RangeValue } from '@/components/rental/range-calendar';
import { buttonClasses } from '@/components/ui/button';
import { DURATION, EASE_OUT } from '@/components/motion/easing';
import { useCarRanges } from '@/hooks/use-car-ranges';
import { estimate, fitsDates, rentalDays, todayIn } from '@/lib/rental';
import { siteConfig } from '@/lib/site-config';
import { AnimatedMoney } from '../animated-money';
import { bookHref, formatMoney, parseDateParam, type CarCardData } from '../fleet-data';

const DEFAULT_MAX_DAYS = 30;
const NOTE_INITIAL = { opacity: 0, height: 0 } as const;
const NOTE_ANIMATE = { opacity: 1, height: 'auto' } as const;
const NOTE_TRANSITION = { duration: DURATION.fast, ease: EASE_OUT } as const;
const DAY_FMT = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

function formatDay(date: string | null): string {
	return date ? DAY_FMT.format(new Date(`${date}T12:00:00Z`)) : '—';
}

export interface CarBookingProps {
	car: CarCardData;
	/** Server-rendered content for the left column, under the calendar (included, deposit…). */
	children?: React.ReactNode;
}

/** Reads `?from=&until=` (e.g. from /fleet) and seeds the booking panel. Needs a Suspense boundary. */
export function CarBookingFromParams(props: CarBookingProps) {
	const sp = useSearchParams();
	const from = parseDateParam(sp.get('from'));
	const until = parseDateParam(sp.get('until'));
	return <CarBooking {...props} initialFrom={from} initialUntil={until} key={`${from}-${until}`} />;
}

/**
 * Availability calendar + sticky booking card for one car. The calendar
 * strikes through booked days (ranges from `useCarRanges`); the card shows a
 * live estimate (days × daily rate), the deposit separately, and hands the
 * chosen dates to `/book`.
 */
export function CarBooking({
	car,
	children,
	initialFrom = null,
	initialUntil = null,
}: CarBookingProps & { initialFrom?: string | null; initialUntil?: string | null }) {
	const tz = siteConfig.timezone;
	const reduce = useReducedMotion();
	const today = useMemo(() => todayIn(tz), [tz]);
	const [value, setValue] = useState<RangeValue>(() => {
		const from = initialFrom && initialFrom >= today ? initialFrom : null;
		const until = from && initialUntil && rentalDays(from, initialUntil) >= 1 ? initialUntil : null;
		return { from, until };
	});

	const { ranges, isLoading, error } = useCarRanges(car.slug);
	const onChange = useCallback((v: RangeValue) => setValue(v), []);

	const days = value.from && value.until ? rentalDays(value.from, value.until) : 0;
	const complete = days >= 1;
	const maxDays = car.maxDays ?? DEFAULT_MAX_DAYS;
	const loaded = !isLoading && !error;
	const fits = complete && loaded ? fitsDates(ranges, value.from!, value.until!, tz) : null;
	const tooLong = complete && days > maxDays;
	const est = estimate(car.pricePerDay, complete ? days : 0);
	const ok = complete && fits !== false && !tooLong;

	let note: string | null = null;
	if (error) note = 'Live availability could not be loaded. You can still pick dates; we confirm them before you pay.';
	else if (tooLong) note = `This car books for up to ${maxDays} days online. Message the concierge for longer rentals.`;
	else if (fits === false) note = 'The car is out for part of those dates. Pick another range, or try a similar car below.';

	const deposit = car.content?.depositAed ?? null;

	return (
		<section id="book" aria-labelledby="book-heading" className="scroll-mt-24">
			<div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-[var(--spacing-section-sm)] lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-[var(--spacing-section)]">
				<div className="min-w-0 lg:col-span-7 lg:row-start-1">
					<p className="eyebrow mb-4">Availability</p>
					<h2 id="book-heading" className="heading-display mb-3 text-[clamp(1.5rem,3vw,2.6rem)] text-[var(--color-ink)]">
						Choose your dates
					</h2>
					<p className="mb-10 max-w-lg text-sm leading-relaxed text-[var(--color-ink-muted)]">
						Pick a pick-up day, then a return day. Struck-through days are already booked. Rentals run from pick-up to return, priced per day in {tz.split('/')[1]} time.
					</p>
					<div className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-6">
						<RangeCalendar
							ranges={ranges}
							timezone={tz}
							value={value}
							onChange={onChange}
							maxDays={maxDays}
							minDate={today}
							loading={isLoading && ranges.length === 0}
						/>
					</div>
				</div>

				{/* Mobile order: calendar → card → terms. Desktop: card rides beside both. */}
				<aside aria-label="Booking summary" className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
					<div className="glass-strong card-shadow-lg flex flex-col gap-6 p-6 lg:sticky lg:top-28 lg:p-8">
						<div className="flex items-start justify-between gap-6">
							<div className="min-w-0">
								<p className="eyebrow">{car.categoryLabel ?? 'Rental'}</p>
								<p className="heading-display mt-2 text-xl text-[var(--color-ink)]">{car.title}</p>
							</div>
							<p className="shrink-0 text-right">
								<span className="tabular block text-lg text-[var(--color-ink)]">{formatMoney(car.pricePerDay, car.currency)}</span>
								<span className="eyebrow">/ day</span>
							</p>
						</div>

						<dl className="grid grid-cols-2 border-y border-[var(--color-line)]">
							<div className="border-r border-[var(--color-line)] py-4 pr-4">
								<dt className="eyebrow">Pick-up</dt>
								<dd className="tabular mt-2 text-[var(--color-ink)]">{formatDay(value.from)}</dd>
							</div>
							<div className="py-4 pl-4">
								<dt className="eyebrow">Return</dt>
								<dd className="tabular mt-2 text-[var(--color-ink)]">{formatDay(value.until)}</dd>
							</div>
						</dl>

						<dl className="flex flex-col gap-3 text-sm" aria-live="polite">
							<div className="flex items-baseline">
								<dt className="text-[var(--color-ink-muted)]">
									<span className="tabular">{complete ? days : 0}</span> {days === 1 ? 'day' : 'days'} ×{' '}
									<span className="tabular">{formatMoney(car.pricePerDay, car.currency)}</span>
								</dt>
								<span aria-hidden className="leader-line" />
								<dd>
									<AnimatedMoney value={est.base} currency={car.currency} className="text-[var(--color-ink)]" />
								</dd>
							</div>
							<div className="flex items-baseline">
								<dt className="text-[var(--color-ink-muted)]">Delivery in Dubai</dt>
								<span aria-hidden className="leader-line" />
								<dd className="text-[var(--color-ink)]">Included</dd>
							</div>
							{car.content ? (
								<div className="flex items-baseline">
									<dt className="text-[var(--color-ink-muted)]">Kilometres</dt>
									<span aria-hidden className="leader-line" />
									<dd className="tabular text-[var(--color-ink)]">
										{(car.content.kmPerDay * Math.max(days, 1)).toLocaleString('en-US')} km
									</dd>
								</div>
							) : null}
						</dl>

						<div className="flex items-end justify-between border-t border-[var(--color-line)] pt-5">
							<div>
								<p className="eyebrow">Estimated total</p>
								<p className="mt-1 text-xs text-[var(--color-ink-dim)]">Extras are added in the next step</p>
							</div>
							<AnimatedMoney value={est.total} currency={car.currency} className="text-3xl text-[var(--color-ink)]" />
						</div>

						{deposit !== null ? (
							<div className="flex items-start justify-between gap-4 bg-[var(--color-tint)] px-4 py-3.5">
								<div>
									<p className="text-sm text-[var(--color-ink)]">Security deposit</p>
									<p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">Held at handover, not charged online</p>
								</div>
								<p className="tabular shrink-0 text-sm text-[var(--color-primary)]">{formatMoney(deposit, car.currency)}</p>
							</div>
						) : null}

						<AnimatePresence initial={false}>
							{note ? (
								<motion.p
									key={note}
									role="status"
									initial={reduce ? false : NOTE_INITIAL}
									animate={NOTE_ANIMATE}
									exit={NOTE_INITIAL}
									transition={NOTE_TRANSITION}
									className="overflow-hidden border-l border-[var(--color-primary)] pl-3 text-sm leading-relaxed text-[var(--color-ink-muted)]"
								>
									{note}
								</motion.p>
							) : null}
						</AnimatePresence>

						<Link
							href={ok ? bookHref(car.slug, value.from, value.until) : bookHref(car.slug)}
							className={buttonClasses('primary', 'lg', { fullWidth: true })}
						>
							{!complete ? 'Book this car' : ok ? `Book ${days} ${days === 1 ? 'day' : 'days'}` : 'Book other dates'}
						</Link>
						<a
							href={siteConfig.contact.whatsappHref}
							target="_blank"
							rel="noreferrer"
							className="text-center text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
						>
							Questions? WhatsApp the concierge
						</a>
					</div>
				</aside>

				{children ? <div className="min-w-0 pt-6 lg:col-span-7 lg:row-start-2 lg:pt-[var(--spacing-section-sm)]">{children}</div> : null}
			</div>
		</section>
	);
}
