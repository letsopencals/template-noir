'use client';

import { memo } from 'react';
import { SafeImage } from '@/components/ui/safe-image';
import { Reveal } from '@/components/motion/reveal';
import { siteConfig } from '@/lib/site-config';
import type { ConfirmedBooking } from './confirmed-booking';

const TZ = siteConfig.timezone;
const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });

/** YYYY-MM-DD (already local) → "Tue 10 Nov 2026". */
function day(date: string): string {
	return DAY.format(new Date(`${date}T00:00:00Z`));
}

interface Step {
	label: string;
	when: string;
	detail: string;
}

function rentalSteps(b: ConfirmedBooking): Step[] {
	const garage = siteConfig.contact.address.replace(/\n/g, ', ');
	return [
		{ label: 'Confirmed', when: 'Now', detail: 'Your confirmation is on its way by email.' },
		{
			label: b.delivered ? 'Delivery & handover' : 'Collect from the garage',
			when: `${day(b.fromDate)}${b.handoverWindow ? ` · ${b.handoverWindow}` : ''}`,
			detail: b.delivered
				? `A NOIR driver brings the car to ${b.address ?? 'your address'}${b.flightNumber ? ` (flight ${b.flightNumber})` : ''}, walks you through it and holds the deposit.`
				: `${garage}. We walk you through the car and hold the deposit.`,
		},
		{
			label: 'Return',
			when: `${day(b.toDate)}${b.returnWindow ? ` · ${b.returnWindow}` : ''}`,
			detail: b.collectAddress
				? `We collect the car from ${b.collectAddress}.`
				: b.delivered
					? `We collect the car from ${b.address ?? 'your address'}.`
					: `Back to the garage at ${siteConfig.contact.addressShort}.`,
		},
	];
}

function chauffeurSteps(b: ConfirmedBooking): Step[] {
	const time = `${TIME.format(new Date(b.from))}–${TIME.format(new Date(b.to))}`;
	return [
		{ label: 'Confirmed', when: 'Now', detail: 'Your confirmation is on its way by email.' },
		{
			label: 'Pick-up',
			when: `${day(b.fromDate)} · ${time}`,
			detail: `${b.chauffeur ? `${b.chauffeur} meets you` : 'Your chauffeur meets you'} ${b.address ? `at ${b.address}` : `at ${siteConfig.contact.addressShort}`}${b.flightNumber ? ` (flight ${b.flightNumber})` : ''}.`,
		},
		...(b.preferredCar
			? [{ label: 'Preferred car', when: 'Before the day', detail: `You asked for the ${b.preferredCar}. ${siteConfig.chauffeur.note}` }]
			: []),
	];
}

/** Car or package image, Dubai dates and the handover timeline for one booking. */
export const BookingCard = memo(function BookingCard({ booking: b }: { booking: ConfirmedBooking }) {
	const steps = b.kind === 'rental' ? rentalSteps(b) : chauffeurSteps(b);
	const showGarage = b.kind === 'rental' && !b.delivered;

	return (
		<article className="border border-[var(--color-line)] bg-[var(--color-surface)]">
			<div className="image-placeholder relative aspect-[16/9] overflow-hidden">
				<SafeImage src={b.image} alt={b.title} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" priority />
				<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-6 pb-5 pt-16">
					<p className="eyebrow">{b.kind === 'rental' ? 'Your car' : 'Your journey'}</p>
					<h2 className="heading-display mt-2 text-2xl text-[var(--color-ink)] sm:text-3xl">{b.title}</h2>
				</div>
			</div>

			<div className="grid grid-cols-2 border-b border-[var(--color-line)]">
				<div className="border-r border-[var(--color-line)] px-6 py-4">
					<p className="text-[0.6rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]">{b.kind === 'rental' ? 'Pick-up' : 'Date'}</p>
					<p className="tabular mt-1 text-sm text-[var(--color-ink)]">{day(b.fromDate)}</p>
				</div>
				<div className="px-6 py-4">
					<p className="text-[0.6rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]">{b.kind === 'rental' ? 'Return' : 'Time · Dubai'}</p>
					<p className="tabular mt-1 text-sm text-[var(--color-ink)]">
						{b.kind === 'rental' ? day(b.toDate) : `${TIME.format(new Date(b.from))}–${TIME.format(new Date(b.to))}`}
					</p>
				</div>
			</div>

			<ol className="px-6 py-6">
				{steps.map((s, i) => (
					<Reveal key={s.label} as="li" delay={0.1 + i * 0.08}>
						<div className={i < steps.length - 1 ? 'relative flex gap-5 pb-6' : 'relative flex gap-5'}>
							<div className="flex flex-col items-center">
								<span
									className={
										i === 0
											? 'tabular flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--color-primary)] text-[0.66rem] text-black'
											: 'tabular flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--color-line-strong)] text-[0.66rem] text-[var(--color-ink-muted)]'
									}
								>
									{String(i + 1).padStart(2, '0')}
								</span>
								{i < steps.length - 1 ? <span aria-hidden className="mt-1 w-px flex-1 bg-[var(--color-line-strong)]" /> : null}
							</div>
							<div className="min-w-0 pb-1">
								<p className="text-sm text-[var(--color-ink)]">{s.label}</p>
								<p className="tabular mt-0.5 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-primary)]">{s.when}</p>
								<p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{s.detail}</p>
							</div>
						</div>
					</Reveal>
				))}
			</ol>

			{showGarage ? (
				<div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-line)] px-6 py-4">
					<p className="whitespace-pre-line text-xs leading-relaxed text-[var(--color-ink-muted)]">{siteConfig.contact.address}</p>
					<a href={siteConfig.contact.mapHref} target="_blank" rel="noopener noreferrer" className="link-underline text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-primary)]">
						Directions
					</a>
				</div>
			) : null}

			{b.depositAed ? (
				<p className="border-t border-[var(--color-line)] px-6 py-4 text-xs text-[var(--color-ink-dim)]">
					Security deposit <span className="tabular text-[var(--color-ink-muted)]">AED {b.depositAed.toLocaleString('en-US')}</span>, held on a card at handover. Not charged online.
				</p>
			) : null}
		</article>
	);
});
