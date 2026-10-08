'use client';

import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { EASE_OUT } from '@/components/motion/easing';
import type { BookCar } from './book-car';
import { formatMoney } from './money';

interface CarSwitcherProps {
	cars: BookCar[];
	active: BookCar;
	onSelect: (slug: string) => void;
}

const UNDERLINE_TRANSITION = { type: 'spring', stiffness: 420, damping: 38, mass: 0.8 } as const;
const IMAGE_INITIAL = { opacity: 0, scale: 1.04, x: 24 };
const IMAGE_ANIMATE = { opacity: 1, scale: 1, x: 0 };
const IMAGE_EXIT = { opacity: 0, scale: 0.98, x: -24 };
const IMAGE_TRANSITION = { duration: 0.8, ease: EASE_OUT };
const TEXT_INITIAL = { opacity: 0, y: 10 };
const TEXT_ANIMATE = { opacity: 1, y: 0 };
const TEXT_EXIT = { opacity: 0, y: -6 };
const TEXT_TRANSITION = { duration: 0.45, ease: EASE_OUT };
const NO_TRANSITION = { duration: 0 };

/**
 * Car tabs (morphing champagne underline) over a large side-profile image
 * that crossfades between cars. Arrow keys move between tabs.
 */
export function CarSwitcher({ cars, active, onSelect }: CarSwitcherProps) {
	const reduce = useReducedMotion();
	const listRef = useRef<HTMLDivElement>(null);

	// Keep the active tab in view in the horizontal strip.
	useEffect(() => {
		const list = listRef.current;
		const el = list?.querySelector<HTMLElement>(`[data-slug="${active.slug}"]`);
		if (!list || !el) return;
		// Scroll the strip only (scrollIntoView would also move the page).
		list.scrollTo({
			left: el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2,
			behavior: reduce ? 'auto' : 'smooth',
		});
	}, [active.slug, reduce]);

	const onKeyDown = useCallback(
		(e: KeyboardEvent<HTMLButtonElement>, i: number) => {
			const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
			if (!delta) return;
			e.preventDefault();
			const next = cars[(i + delta + cars.length) % cars.length];
			if (!next) return;
			onSelect(next.slug);
			listRef.current?.querySelector<HTMLButtonElement>(`[data-slug="${next.slug}"]`)?.focus();
		},
		[cars, onSelect],
	);

	return (
		<div>
			<div
				ref={listRef}
				role="tablist"
				aria-label="Choose a car"
				data-lenis-prevent
				className="no-scrollbar relative -mx-6 flex gap-7 overflow-x-auto border-b border-[var(--color-line)] px-6 lg:-mx-10 lg:px-10"
			>
				{cars.map((car, i) => {
					const selected = car.slug === active.slug;
					return (
						<button
							key={car.slug}
							type="button"
							role="tab"
							data-slug={car.slug}
							aria-selected={selected}
							aria-controls="book-car-panel"
							tabIndex={selected ? 0 : -1}
							onClick={() => onSelect(car.slug)}
							onKeyDown={(e) => onKeyDown(e, i)}
							className={clsx(
								'relative shrink-0 whitespace-nowrap pb-4 pt-1 text-[0.68rem] uppercase tracking-[0.22em] outline-none transition-colors duration-300',
								'focus-visible:text-[var(--color-ink)]',
								selected ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-dim)] hover:text-[var(--color-ink-muted)]',
							)}
						>
							{car.title}
							{selected ? (
								<motion.span
									layoutId={reduce ? undefined : 'book-car-underline'}
									transition={reduce ? NO_TRANSITION : UNDERLINE_TRANSITION}
									className="absolute inset-x-0 -bottom-px h-px bg-[var(--color-primary)]"
									aria-hidden
								/>
							) : null}
						</button>
					);
				})}
			</div>

			<div id="book-car-panel" role="tabpanel" aria-label={active.title} className="grid items-end gap-8 pt-8 lg:grid-cols-[1fr_minmax(0,1.6fr)]">
				<div className="min-h-[7.5rem]">
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={active.slug}
							initial={reduce ? false : TEXT_INITIAL}
							animate={TEXT_ANIMATE}
							exit={reduce ? undefined : TEXT_EXIT}
							transition={reduce ? NO_TRANSITION : TEXT_TRANSITION}
						>
							{active.categoryLabel ? <p className="eyebrow mb-3">{active.categoryLabel}</p> : null}
							<h1 className="heading-display text-[clamp(2rem,5vw,4rem)] leading-[0.95] text-[var(--color-ink)]">
								{active.title}
							</h1>
							{active.tagline ? (
								<p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-ink-muted)]">{active.tagline}</p>
							) : null}
							<p className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
								<span className="tabular text-[var(--color-primary)]">
									{formatMoney(active.pricePerDay, active.currency)}
									<span className="text-[var(--color-ink-dim)]"> / day</span>
								</span>
								<Link href={`/fleet/${active.slug}`} className="link-underline text-xs uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
									Specs
								</Link>
							</p>
						</motion.div>
					</AnimatePresence>
				</div>

				<div className="image-placeholder relative aspect-[16/8] overflow-hidden">
					<AnimatePresence initial={false}>
						<motion.div
							key={active.slug}
							className="absolute inset-0"
							initial={reduce ? false : IMAGE_INITIAL}
							animate={IMAGE_ANIMATE}
							exit={reduce ? undefined : IMAGE_EXIT}
							transition={reduce ? NO_TRANSITION : IMAGE_TRANSITION}
						>
							<SafeImage
								src={active.images.side}
								alt={`${active.title}, side profile`}
								fill
								priority
								sizes="(min-width: 1024px) 60vw, 100vw"
								className="object-cover"
							/>
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}
