import Link from 'next/link';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { carHref, formatMoney, type CarCardData } from './fleet-data';

export interface FleetCardProps {
	car: CarCardData;
	/** 'large' spans wide with a cinematic 16:9 frame; 'small' is a taller crop. */
	size?: 'large' | 'small';
	/** Carry the chosen dates to the car page. */
	from?: string | null;
	until?: string | null;
	/** Shows a status line when dates are set: true = free, false = booked, null = unknown. */
	available?: boolean | null;
	/** Index shown as "01", "02"… in the corner. */
	index?: number;
	priority?: boolean;
	className?: string;
}

/**
 * A car tile: side profile on the studio sweep (slow zoom on hover), the model
 * name in the expanded display face and the daily rate in mono. Works as a
 * Server or Client Component (hover is pure CSS).
 */
export function FleetCard({ car, size = 'small', from, until, available, index, priority, className }: FleetCardProps) {
	const c = car.content;
	return (
		<Link
			href={carHref(car.slug, from, until)}
			className={clsx(
				'group/card relative flex h-full flex-col border border-[var(--color-line)] bg-[var(--color-surface)] transition-colors duration-500 hover:border-[var(--color-line-strong)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
				className,
			)}
		>
			<div
				className={clsx(
					'image-placeholder relative overflow-hidden',
					size === 'large' ? 'aspect-[16/9]' : 'aspect-[4/3]',
				)}
			>
				<SafeImage
					src={car.image}
					alt={car.title}
					fill
					priority={priority}
					sizes={size === 'large' ? '(min-width: 1024px) 58vw, 100vw' : '(min-width: 1024px) 42vw, 100vw'}
					className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/card:scale-100"
				/>
				<span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
				<div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
					{car.categoryLabel ? <span className="chip bg-black/40 backdrop-blur-sm">{car.categoryLabel}</span> : <span />}
					{index !== undefined ? (
						<span className="tabular text-xs text-[var(--color-ink-muted)]">{String(index + 1).padStart(2, '0')}</span>
					) : null}
				</div>
				{available !== undefined && from && until ? <AvailabilityTag available={available} /> : null}
			</div>

			<div className="flex flex-1 flex-col gap-5 p-5 lg:p-6">
				<div className="flex items-start justify-between gap-6">
					<div className="min-w-0">
						<h3
							className={clsx(
								'heading-display text-[var(--color-ink)]',
								size === 'large' ? 'text-[clamp(1.4rem,2.6vw,2.4rem)]' : 'text-[clamp(1.2rem,1.9vw,1.7rem)]',
							)}
						>
							{car.title}
						</h3>
						{c ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{c.tagline}</p> : null}
					</div>
					<p className="shrink-0 text-right">
						<span className="tabular block text-lg text-[var(--color-ink)] lg:text-xl">{formatMoney(car.pricePerDay, car.currency)}</span>
						<span className="eyebrow">/ day</span>
					</p>
				</div>

				{c ? (
					<dl className="mt-auto grid grid-cols-3 border-t border-[var(--color-line)] pt-4">
						<Spec label="Power" value={`${c.hp.toLocaleString('en-US')} hp`} />
						<Spec label="0–100" value={`${c.zeroToHundred.toFixed(1)} s`} />
						<Spec label="Seats" value={String(c.seats)} />
					</dl>
				) : null}

				<span
					aria-hidden
					className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--color-primary)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-x-100"
				/>
			</div>
		</Link>
	);
}

function Spec({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="eyebrow text-[0.6rem]">{label}</dt>
			<dd className="tabular mt-1 text-sm text-[var(--color-ink)]">{value}</dd>
		</div>
	);
}

function AvailabilityTag({ available }: { available: boolean | null }) {
	const label = available === true ? 'Free for your dates' : available === false ? 'Booked for your dates' : 'Check dates';
	return (
		<span className="absolute bottom-4 left-5 inline-flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-ink)]">
			<span
				aria-hidden
				className={clsx(
					'h-1.5 w-1.5 rounded-full',
					available === true ? 'bg-[var(--color-primary)]' : available === false ? 'bg-[var(--color-ink-dim)]' : 'bg-[var(--color-ink-muted)]',
				)}
			/>
			{label}
		</span>
	);
}
