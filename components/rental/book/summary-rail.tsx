'use client';

import { memo } from 'react';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { siteConfig } from '@/lib/site-config';
import type { BookCar } from './book-car';
import type { HandoverMode } from '@/hooks/use-rental-handover';
import { AnimatedNumber } from './animated-number';
import { formatCountdown, formatMoney } from './money';
import { shortDate } from './when-where';

export interface BookTotals {
	days: number;
	base: number;
	extras: number;
	/** Estimate, or the cart total once the car is held. */
	total: number;
	/** True when `total` comes from the held cart. */
	fromCart: boolean;
	extrasLines: Array<{ id: string; label: string; amount: number }>;
}

interface SummaryRailProps {
	car: BookCar;
	from: string | null;
	until: string | null;
	mode: HandoverMode;
	handoverTime: string | null;
	returnTime: string | null;
	totals: BookTotals;
	held: boolean;
	timeRemaining: number | null;
}

/** Desktop booking summary, sticky beside the steps. */
export const SummaryRail = memo(function SummaryRail({
	car,
	from,
	until,
	mode,
	handoverTime,
	returnTime,
	totals,
	held,
	timeRemaining,
}: SummaryRailProps) {
	const money = (n: number) => formatMoney(n, car.currency);
	return (
		<aside aria-label="Booking summary" className="sticky top-28 border border-[var(--color-line)] bg-[var(--color-surface)]">
			<div className="image-placeholder relative aspect-[16/9] overflow-hidden border-b border-[var(--color-line)]">
				<SafeImage src={car.gallery[1] ?? car.image} alt={car.title} fill sizes="380px" className="object-cover" />
			</div>
			<div className="space-y-6 px-6 py-6">
				<div>
					<p className="eyebrow mb-2">Your rental</p>
					<p className="heading-display text-lg text-[var(--color-ink)]">{car.title}</p>
				</div>

				<dl className="space-y-3 text-sm">
					<Row label="Pick-up" value={from ? `${shortDate(from)}${handoverTime ? ` · ${handoverTime}` : ''}` : '—'} />
					<Row label="Return" value={until ? `${shortDate(until)}${returnTime ? ` · ${returnTime}` : ''}` : '—'} />
					<Row label="Handover" value={mode === 'delivery' ? 'Delivered to you' : `Garage, ${siteConfig.contact.addressShort}`} />
				</dl>

				<dl className="space-y-3 border-t border-[var(--color-line)] pt-5 text-sm">
					<Row
						label={`${totals.days || 0} ${totals.days === 1 ? 'day' : 'days'} × ${money(car.pricePerDay)}`}
						value={money(totals.base)}
						mono
					/>
					{totals.extrasLines.map((l) => (
						<Row key={l.id} label={l.label} value={money(l.amount)} mono muted />
					))}
					<div className="flex items-baseline justify-between gap-4 border-t border-[var(--color-line)] pt-4">
						<dt className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
							{totals.fromCart ? 'Total' : 'Estimated total'}
						</dt>
						<dd>
							<AnimatedNumber value={totals.total} format={money} className="tabular text-xl text-[var(--color-primary)]" />
						</dd>
					</div>
				</dl>

				{car.depositAed ? (
					<p className="border-l border-[var(--color-primary-dark)] pl-3 text-xs leading-relaxed text-[var(--color-ink-muted)]">
						Deposit <span className="tabular text-[var(--color-ink)]">{money(car.depositAed)}</span>, held on a card at handover. Not
						charged online.
					</p>
				) : null}

				{held && timeRemaining !== null ? (
					<p className={clsx('text-xs', timeRemaining < 120 ? 'text-[#E5787A]' : 'text-[var(--color-ink-muted)]')}>
						Held for you for <span className="tabular">{formatCountdown(timeRemaining)}</span>
					</p>
				) : null}
			</div>
		</aside>
	);
});

function Row({ label, value, mono, muted }: { label: string; value: string; mono?: boolean; muted?: boolean }) {
	return (
		<div className="flex items-baseline justify-between gap-4">
			<dt className={clsx('min-w-0', muted ? 'text-[var(--color-ink-dim)]' : 'text-[var(--color-ink-muted)]')}>{label}</dt>
			<dd className={clsx('text-right text-[var(--color-ink)]', mono ? 'tabular' : '')}>{value}</dd>
		</div>
	);
}
