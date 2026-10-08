'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, type Transition, type Variants } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { DURATION, EASE_OUT } from '@/components/motion/easing';
import { AnimatedMoney } from '@/components/fleet/animated-money';
import { formatMoney, modelName, type CarCardData } from '@/components/fleet/fleet-data';

const LAYER_TRANSITION: Transition = { duration: DURATION.slow, ease: EASE_OUT };
const LAYER_REDUCED: Transition = { duration: DURATION.fast };
/**
 * Layers before the active car wait off to the left, layers after it to the
 * right. Moving down the list therefore slides the new car in from the right
 * and the old one out to the left (and the reverse going up), with no extra
 * direction state.
 */
const LAYER: Variants = {
	before: { opacity: 0, x: '-8%', scale: 1.05, filter: 'blur(10px)' },
	active: { opacity: 1, x: '0%', scale: 1, filter: 'blur(0px)' },
	after: { opacity: 0, x: '8%', scale: 1.05, filter: 'blur(10px)' },
};
const LAYER_FADE: Variants = {
	before: { opacity: 0 },
	active: { opacity: 1 },
	after: { opacity: 0 },
};
const WORD_INITIAL = { opacity: 0, y: '40%' } as const;
const WORD_ANIMATE = { opacity: 1, y: '0%' } as const;
const WORD_EXIT = { opacity: 0, y: '-40%' } as const;
const WORD_TRANSITION: Transition = { duration: DURATION.base, ease: EASE_OUT };
const FADE_INITIAL = { opacity: 0 } as const;
const FADE_ANIMATE = { opacity: 1 } as const;
const INDICATOR_TRANSITION: Transition = { type: 'spring', stiffness: 420, damping: 38 };
/** Hover intent: ignore rows the pointer only brushes past. */
const HOVER_DELAY_MS = 60;

export interface RatesExplorerProps {
	cars: CarCardData[];
}

/**
 * The signature rates interaction. A full rates table on the left; on the
 * right a sticky stage where the hovered (or keyboard-focused) row's car
 * crossfades in, sliding from the direction you moved through the list, with
 * its model name, rate and deposit tweening to the new values.
 * Below `lg` it becomes a stack of cards.
 */
export function RatesExplorer({ cars }: RatesExplorerProps) {
	const [active, setActive] = useState(0);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const select = useCallback((i: number, immediate = false) => {
		if (timer.current) clearTimeout(timer.current);
		if (immediate) setActive(i);
		else timer.current = setTimeout(() => setActive(i), HOVER_DELAY_MS);
	}, []);
	useEffect(() => () => {
		if (timer.current) clearTimeout(timer.current);
	}, []);

	if (cars.length === 0) return null;

	return (
		<>
			{/* Desktop: table + stage */}
			<div className="hidden gap-14 lg:grid lg:grid-cols-12">
				<div className="lg:col-span-7">
					<table className="w-full border-collapse text-left">
						<caption className="sr-only">Daily rates, deposits and included kilometres for every car</caption>
						<thead>
							<tr className="border-b border-[var(--color-line-strong)]">
								<th scope="col" className="eyebrow w-12 py-4 font-medium">
									<span className="sr-only">Number</span>
								</th>
								<th scope="col" className="eyebrow py-4 font-medium">
									Car
								</th>
								<th scope="col" className="eyebrow py-4 text-right font-medium">
									Per day
								</th>
								<th scope="col" className="eyebrow py-4 text-right font-medium">
									Deposit
								</th>
								<th scope="col" className="eyebrow py-4 pr-2 text-right font-medium">
									km / day
								</th>
							</tr>
						</thead>
						<tbody className="group/rows">
							{cars.map((c, i) => (
								<RateRow key={c.slug} car={c} index={i} active={i === active} onSelect={select} />
							))}
						</tbody>
					</table>
				</div>

				<div className="lg:col-span-5">
					<RateStage cars={cars} active={active} />
				</div>
			</div>

			{/* Mobile + tablet: stacked cards */}
			<ul className="grid gap-4 sm:grid-cols-2 lg:hidden">
				{cars.map((c) => (
					<li key={c.slug}>
						<RateCard car={c} />
					</li>
				))}
			</ul>
		</>
	);
}

/* ------------------------------------------------------------------- Row */

const RateRow = memo(function RateRow({
	car,
	index,
	active,
	onSelect,
}: {
	car: CarCardData;
	index: number;
	active: boolean;
	onSelect: (i: number, immediate?: boolean) => void;
}) {
	return (
		<tr
			onMouseEnter={() => onSelect(index)}
			onFocus={() => onSelect(index, true)}
			className={clsx(
				'border-b border-[var(--color-line)] transition-[color,opacity] duration-500',
				active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)] group-hover/rows:opacity-60',
			)}
		>
			<td className="relative py-5 align-middle">
				{active ? (
					<motion.span
						layoutId="rates-indicator"
						transition={INDICATOR_TRANSITION}
						aria-hidden
						className="absolute top-1/2 left-0 h-8 w-px -translate-y-1/2 bg-[var(--color-primary)]"
					/>
				) : null}
				<span className={clsx('tabular pl-4 text-xs transition-colors', active ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink-dim)]')}>
					{String(index + 1).padStart(2, '0')}
				</span>
			</td>
			<td className="py-5 pr-4 align-middle">
				<Link
					href={`/fleet/${car.slug}`}
					className="group/link block focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]"
				>
					<span
						className={clsx(
							'heading-display block text-[clamp(1rem,1.5vw,1.35rem)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
							active && 'translate-x-1.5',
						)}
					>
						{car.title}
					</span>
					{car.categoryLabel ? <span className="eyebrow mt-1.5 block text-[0.6rem]">{car.categoryLabel}</span> : null}
				</Link>
			</td>
			<td className="tabular py-5 text-right align-middle text-[0.95rem]">{formatMoney(car.pricePerDay, car.currency)}</td>
			<td className="tabular py-5 text-right align-middle text-sm">
				{car.content ? formatMoney(car.content.depositAed, car.currency) : '—'}
			</td>
			<td className="tabular py-5 pr-2 text-right align-middle text-sm">{car.content ? car.content.kmPerDay : '—'}</td>
		</tr>
	);
});

/* ----------------------------------------------------------------- Stage */

function RateStage({ cars, active }: { cars: CarCardData[]; active: number }) {
	const reduce = useReducedMotion();
	const car = cars[active]!;
	const c = car.content;

	return (
		<div className="sticky top-28 flex flex-col gap-6">
			<div className="image-placeholder grain relative aspect-[4/3] overflow-hidden border border-[var(--color-line)]">
				{/* Model name backdrop */}
				<div aria-hidden className="pointer-events-none absolute inset-x-0 top-[10%] overflow-hidden px-6">
					<AnimatePresence mode="popLayout" initial={false}>
						<motion.p
							key={car.slug}
							initial={reduce ? FADE_INITIAL : WORD_INITIAL}
							animate={reduce ? FADE_ANIMATE : WORD_ANIMATE}
							exit={reduce ? FADE_INITIAL : WORD_EXIT}
							transition={WORD_TRANSITION}
							className="heading-display truncate text-[clamp(3rem,7vw,7rem)] leading-none text-transparent [-webkit-text-stroke:1px_rgba(244,241,234,0.16)]"
						>
							{modelName(car.title)}
						</motion.p>
					</AnimatePresence>
				</div>

				{/* Every car is mounted once and toggled, so a hover never waits on a download. */}
				{cars.map((item, i) => {
					const on = i === active;
					return (
						<motion.div
							key={item.slug}
							aria-hidden={!on}
							className="absolute inset-0"
							variants={reduce ? LAYER_FADE : LAYER}
							initial={false}
							animate={on ? 'active' : i < active ? 'before' : 'after'}
							transition={reduce ? LAYER_REDUCED : LAYER_TRANSITION}
						>
							<SafeImage
								src={item.image}
								alt={on ? item.title : ''}
								fill
								sizes="(min-width: 1024px) 40vw, 1px"
								className="object-cover"
							/>
						</motion.div>
					);
				})}

				<span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />

				<div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6">
					<div className="min-w-0">
						<p className="eyebrow">{car.categoryLabel ?? 'Fleet'}</p>
						<p className="heading-display mt-2 truncate text-xl text-[var(--color-ink)]">{car.title}</p>
					</div>
					<p className="tabular shrink-0 text-xs text-[var(--color-ink-muted)]">
						<span className="text-[var(--color-primary)]">{String(active + 1).padStart(2, '0')}</span> / {String(cars.length).padStart(2, '0')}
					</p>
				</div>
			</div>

			<dl className="grid grid-cols-3 border-y border-[var(--color-line)]" aria-live="polite">
				<div className="border-r border-[var(--color-line)] py-5 pr-4">
					<dt className="eyebrow">Per day</dt>
					<dd className="mt-2 text-lg text-[var(--color-ink)]">
						<AnimatedMoney value={car.pricePerDay} currency={car.currency} />
					</dd>
				</div>
				<div className="border-r border-[var(--color-line)] px-4 py-5">
					<dt className="eyebrow">Deposit</dt>
					<dd className="mt-2 text-lg text-[var(--color-ink)]">
						{c ? <AnimatedMoney value={c.depositAed} currency={car.currency} /> : <span className="tabular">—</span>}
					</dd>
				</div>
				<div className="py-5 pl-4">
					<dt className="eyebrow">Power</dt>
					<dd className="tabular mt-2 text-lg text-[var(--color-ink)]">{c ? `${c.hp.toLocaleString('en-US')} hp` : '—'}</dd>
				</div>
			</dl>

			<div className="flex items-center justify-between gap-6">
				<p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{c?.tagline ?? car.description}</p>
				<Link
					href={`/fleet/${car.slug}`}
					tabIndex={-1}
					className="link-underline shrink-0 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-primary)]"
				>
					View car
				</Link>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------- Mobile card */

function RateCard({ car }: { car: CarCardData }) {
	const c = car.content;
	return (
		<Link
			href={`/fleet/${car.slug}`}
			className="group/card block border border-[var(--color-line)] bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
		>
			<div className="image-placeholder relative aspect-[16/9] overflow-hidden">
				<SafeImage
					src={car.image}
					alt={car.title}
					fill
					sizes="(min-width: 640px) 50vw, 100vw"
					className="object-cover transition-transform duration-[1200ms] group-hover/card:scale-[1.05] motion-reduce:transition-none"
				/>
				{car.categoryLabel ? <span className="chip absolute top-4 left-4 bg-black/40 backdrop-blur-sm">{car.categoryLabel}</span> : null}
			</div>
			<div className="p-5">
				<p className="heading-display text-lg text-[var(--color-ink)]">{car.title}</p>
				<dl className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--color-line)] pt-4">
					<div>
						<dt className="eyebrow text-[0.58rem]">Per day</dt>
						<dd className="tabular mt-1 text-sm text-[var(--color-ink)]">{formatMoney(car.pricePerDay, car.currency)}</dd>
					</div>
					<div>
						<dt className="eyebrow text-[0.58rem]">Deposit</dt>
						<dd className="tabular mt-1 text-sm text-[var(--color-ink)]">{c ? formatMoney(c.depositAed, car.currency) : '—'}</dd>
					</div>
					<div>
						<dt className="eyebrow text-[0.58rem]">km / day</dt>
						<dd className="tabular mt-1 text-sm text-[var(--color-ink)]">{c ? c.kmPerDay : '—'}</dd>
					</div>
				</dl>
			</div>
		</Link>
	);
}
