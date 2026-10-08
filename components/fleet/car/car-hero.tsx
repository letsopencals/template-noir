'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { RevealText } from '@/components/motion/reveal';
import { DriveIn } from '@/components/motion/drive-in';
import { SafeImage } from '@/components/ui/safe-image';
import { formatMoney, modelName, type CarCardData } from '../fleet-data';

const OFFSET = ['start start', 'end start'] as const;
const STROKE_STYLE = { WebkitTextStroke: '1px rgba(244, 241, 234, 0.14)' } as const;

/**
 * Scroll-driven car hero. A giant outlined model name slides sideways behind
 * the car while the car rises and grows slightly; the foreground copy fades as
 * you scroll into the page. The inner frame is sticky inside a taller section,
 * so the effect plays over the first screen of scroll.
 * Reduced motion: a static composition at normal height.
 */
export function CarHero({ car }: { car: CarCardData }) {
	const ref = useRef<HTMLElement>(null);
	const reduce = useReducedMotion();
	const { scrollYProgress } = useScroll({ target: ref, offset: [...OFFSET] });

	const backdropX = useTransform(scrollYProgress, [0, 1], ['6%', '-34%']);
	const carY = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
	const carScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
	const copyOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
	const copyY = useTransform(scrollYProgress, [0, 0.45], ['0%', '-30%']);

	const model = modelName(car.title);

	return (
		<section ref={ref} aria-label={car.title} className={reduce ? 'relative' : 'relative h-[165svh]'}>
			<div className="aura-blue sticky top-0 flex h-[100svh] min-h-[620px] flex-col overflow-hidden">
				{/* Backdrop word */}
				<motion.p
					aria-hidden
					style={reduce ? STROKE_STYLE : { ...STROKE_STYLE, x: backdropX }}
					className="heading-display pointer-events-none absolute top-[24%] left-0 whitespace-nowrap text-[clamp(7rem,26vw,26rem)] leading-none text-transparent select-none md:top-[18%]"
				>
					{model}
				</motion.p>

				{/* Car */}
				<div className="absolute top-[30%] left-1/2 w-[min(1280px,108vw)] -translate-x-1/2 md:top-[22%]">
					<motion.div style={reduce ? undefined : { y: carY, scale: carScale }} className="will-change-transform">
						<DriveIn trigger="mount" delay={0.15} className="aspect-[16/9]">
							<div className="relative h-full w-full">
								<SafeImage src={car.images.side} alt={car.title} fill priority sizes="(min-width: 1280px) 1280px, 108vw" className="object-contain" />
							</div>
						</DriveIn>
					</motion.div>
				</div>

				<span aria-hidden className="scrim-bottom pointer-events-none absolute inset-x-0 bottom-0 h-[38%]" />

				{/* Copy */}
				<motion.div
					style={reduce ? undefined : { opacity: copyOpacity, y: copyY }}
					className="relative mx-auto mt-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 pb-10 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:pb-14"
				>
					<div className="max-w-2xl">
						<p className="eyebrow mb-5">
							{car.categoryLabel ?? 'Fleet'} · {car.content ? car.content.engine : 'Dubai'}
						</p>
						<RevealText
							as="h1"
							text={car.title}
							trigger="mount"
							delay={0.25}
							className="heading-display text-[clamp(2.2rem,6vw,5.5rem)] text-[var(--color-ink)]"
							lineClassName="pb-[0.06em]"
						/>
						{car.content?.tagline ? (
							<p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--color-ink-muted)] lg:text-lg">{car.content.tagline}</p>
						) : null}
					</div>
					<div className="flex items-end gap-8">
						<p>
							<span className="eyebrow block">From</span>
							<span className="tabular mt-1 block text-3xl text-[var(--color-ink)] lg:text-4xl">{formatMoney(car.pricePerDay, car.currency)}</span>
							<span className="eyebrow block">per day</span>
						</p>
						<a
							href="#book"
							className="group/cue mb-1 hidden items-center gap-3 text-[0.68rem] uppercase tracking-[0.24em] text-[var(--color-primary)] sm:inline-flex"
						>
							Check dates
							<span aria-hidden className="inline-block transition-transform duration-500 group-hover/cue:translate-y-1">
								↓
							</span>
						</a>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
