'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { buttonClasses } from '@/components/ui/button';
import { SafeImage } from '@/components/ui/safe-image';
import { CountUp } from '@/components/motion/count-up';
import { Reveal } from '@/components/motion/reveal';
import { MagneticButton } from '@/components/motion/magnetic-button';
import { CONTAINER, FEATHER_MASK } from '@/components/marketing/styles';
import { formatWholePrice } from '@/components/marketing/format';

export interface SpotlightCar {
	slug: string;
	/** Short model name for the backdrop and CTA ("Cullinan"). */
	name: string;
	/** Full name ("Rolls-Royce Cullinan"). */
	fullName: string;
	tagline: string;
	engine: string;
	image: string | null;
	hp: number;
	zeroToHundred: number;
	topSpeed: number;
	pricePerDay: number | null;
	currency: string;
}

export interface SpotlightProps {
	car: SpotlightCar;
	eyebrow: string;
	ctaLabel: string;
}

const OFFSET = ['start start', 'end end'] as const;
const CAR_X_IN = [0, 0.42, 1] as const;
const CAR_X_OUT = ['-85%', '0%', '14%'];
const CAR_BLUR_IN = [0, 0.32, 0.42] as const;
const CAR_BLUR_OUT = ['blur(12px)', 'blur(2px)', 'blur(0px)'];
const NAME_X_OUT = ['14%', '-22%'];
const CTA_IN = [0.78, 0.9] as const;
const FADE_OUT = [0, 1];
const RISE_OUT = [24, 0];

interface Spec {
	label: string;
	value: number;
	decimals: number;
	unit: string;
	/** Scroll progress window over which this number counts up. */
	range: readonly [number, number];
}

function specsFor(car: SpotlightCar): Spec[] {
	return [
		{ label: 'Power', value: car.hp, decimals: 0, unit: 'hp', range: [0.38, 0.56] },
		{ label: '0–100 km/h', value: car.zeroToHundred, decimals: 1, unit: 's', range: [0.48, 0.66] },
		{ label: 'Top speed', value: car.topSpeed, decimals: 0, unit: 'km/h', range: [0.58, 0.76] },
	];
}

/**
 * Pinned spotlight: a ~280vh section whose sticky stage holds while the car
 * drives across (blur resolving to sharp), the model name drifts the other
 * way behind it, and the specs count up scrubbed to scroll. Reduced motion:
 * a static, un-pinned layout with the final figures (CountUp shows them).
 */
export function Spotlight({ car, eyebrow, ctaLabel }: SpotlightProps) {
	const reduce = useReducedMotion();
	return reduce ? <StaticSpotlight car={car} eyebrow={eyebrow} ctaLabel={ctaLabel} /> : <PinnedSpotlight car={car} eyebrow={eyebrow} ctaLabel={ctaLabel} />;
}

function PinnedSpotlight({ car, eyebrow, ctaLabel }: SpotlightProps) {
	const ref = useRef<HTMLElement>(null);
	const { scrollYProgress } = useScroll({ target: ref, offset: [...OFFSET] });
	const carX = useTransform(scrollYProgress, [...CAR_X_IN], CAR_X_OUT);
	const carBlur = useTransform(scrollYProgress, [...CAR_BLUR_IN], CAR_BLUR_OUT);
	const nameX = useTransform(scrollYProgress, FADE_OUT, NAME_X_OUT);
	const ctaOpacity = useTransform(scrollYProgress, [...CTA_IN], FADE_OUT);
	const ctaY = useTransform(scrollYProgress, [...CTA_IN], RISE_OUT);
	const specs = specsFor(car);

	return (
		<section ref={ref} aria-label={`${eyebrow}: ${car.fullName}`} className="relative h-[280vh] bg-[var(--color-bg-deep)]">
			<div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
				<div aria-hidden className="absolute inset-0 aura-blue" />

				<div className={clsx(CONTAINER, 'relative z-10 flex items-start justify-between gap-6 pt-24 lg:pt-28')}>
					<div>
						<p className="eyebrow mb-3">{eyebrow}</p>
						<h2 className="heading-display text-[clamp(1.5rem,3vw,2.5rem)] text-[var(--color-ink)]">{car.fullName}</h2>
						<p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)]">{car.tagline}</p>
					</div>
					<p className="eyebrow hidden text-right md:block">{car.engine}</p>
				</div>

				{/* Stage */}
				<div className="relative flex flex-1 items-center justify-center">
					<motion.p
						aria-hidden
						style={{ x: nameX }}
						className="heading-display pointer-events-none absolute whitespace-nowrap text-[clamp(6rem,26vw,24rem)] leading-none text-[var(--color-surface-2)]"
					>
						{car.name}
					</motion.p>
					<motion.div style={{ x: carX, filter: carBlur }} className="relative aspect-[16/9] w-[min(1200px,118vw)] will-change-transform sm:w-[min(1200px,92vw)]">
						<span aria-hidden className="absolute inset-x-[10%] bottom-[8%] h-[8%] rounded-[50%] bg-black blur-2xl" />
						<div className={clsx('image-placeholder absolute inset-0', FEATHER_MASK)}>
							<SafeImage src={car.image} alt={car.fullName} fill sizes="(min-width:1200px) 1200px, 100vw" className="object-contain" />
						</div>
					</motion.div>
				</div>

				{/* Specs + CTA */}
				<div className={clsx(CONTAINER, 'relative z-10 pb-8 lg:pb-12')}>
					<div className="grid grid-cols-3 gap-4 border-t border-[var(--color-line)] pt-5 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end lg:gap-10">
						{specs.map((s) => (
							<div key={s.label}>
								<p className="eyebrow mb-2 !tracking-[0.18em]">{s.label}</p>
								<p className="text-[clamp(1.5rem,4.4vw,3.75rem)] leading-none text-[var(--color-ink)]">
									<span className="sr-only">
										{s.value} {s.unit}
									</span>
									<ScrubNumber progress={scrollYProgress} spec={s} />
									<span aria-hidden className="ml-1.5 text-[0.35em] uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
										{s.unit}
									</span>
								</p>
							</div>
						))}
						<motion.div style={{ opacity: ctaOpacity, y: ctaY }} className="col-span-3 mt-3 flex items-center justify-between gap-6 lg:col-span-1 lg:mt-0 lg:justify-end">
							{car.pricePerDay !== null ? (
								<p className="text-sm text-[var(--color-ink-muted)] lg:hidden xl:block">
									from <span className="tabular text-[var(--color-ink)]">{formatWholePrice(car.pricePerDay, car.currency)}</span> / day
								</p>
							) : null}
							<MagneticButton>
								<Link href={`/fleet/${car.slug}`} className={buttonClasses('primary', 'lg')}>
									{ctaLabel}
								</Link>
							</MagneticButton>
						</motion.div>
					</div>
				</div>
			</div>
		</section>
	);
}

function ScrubNumber({ progress, spec }: { progress: MotionValue<number>; spec: Spec }) {
	const text = useTransform(progress, [...spec.range], [0, spec.value], { clamp: true });
	const formatted = useTransform(text, (v) =>
		v.toLocaleString('en-US', { minimumFractionDigits: spec.decimals, maximumFractionDigits: spec.decimals }),
	);
	return (
		<motion.span aria-hidden className="tabular">
			{formatted}
		</motion.span>
	);
}

function StaticSpotlight({ car, eyebrow, ctaLabel }: SpotlightProps) {
	const specs = specsFor(car);
	return (
		<section aria-label={`${eyebrow}: ${car.fullName}`} className="relative overflow-hidden bg-[var(--color-bg-deep)] py-[var(--spacing-section-sm)] lg:py-[var(--spacing-section)]">
			<div className={CONTAINER}>
				<p className="eyebrow mb-3">{eyebrow}</p>
				<h2 className="heading-display text-[clamp(1.5rem,3vw,2.5rem)] text-[var(--color-ink)]">{car.fullName}</h2>
				<p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)]">{car.tagline}</p>
				<div className={clsx('image-placeholder relative mx-auto my-10 aspect-[16/9] w-full max-w-[1200px]', FEATHER_MASK)}>
					<SafeImage src={car.image} alt={car.fullName} fill sizes="(min-width:1200px) 1200px, 100vw" className="object-contain" />
				</div>
				<Reveal className="grid grid-cols-3 gap-4 border-t border-[var(--color-line)] pt-5 lg:gap-10">
					{specs.map((s) => (
						<div key={s.label}>
							<p className="eyebrow mb-2">{s.label}</p>
							<p className="text-[clamp(1.5rem,4.4vw,3.75rem)] leading-none text-[var(--color-ink)]">
								<CountUp value={s.value} decimals={s.decimals} />
								<span className="ml-1.5 text-[0.35em] uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">{s.unit}</span>
							</p>
						</div>
					))}
				</Reveal>
				<div className="mt-10">
					<Link href={`/fleet/${car.slug}`} className={buttonClasses('primary', 'lg')}>
						{ctaLabel}
					</Link>
				</div>
			</div>
		</section>
	);
}
