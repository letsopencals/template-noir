'use client';

import { memo, useCallback, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { DURATION, EASE_OUT } from '@/components/motion/easing';

export interface RouteTeaserItem {
	slug: string;
	title: string;
	region: string;
	distanceKm: number;
	duration: string;
	image: string;
}

export interface RoutesTeaserProps {
	routes: RouteTeaserItem[];
	className?: string;
}

const IMAGE_INITIAL = { opacity: 0, scale: 1.08 } as const;
const IMAGE_ANIMATE = { opacity: 1, scale: 1 } as const;
const IMAGE_EXIT = { opacity: 0 } as const;
const IMAGE_TRANSITION = { duration: DURATION.slow, ease: EASE_OUT } as const;
const FADE_TRANSITION = { duration: 0 } as const;

/**
 * Journal teaser: a numbered list of drives. On desktop, hovering or focusing
 * a row cross-fades its photograph into the sticky frame beside the list; on
 * mobile each row carries its own thumbnail. Reduced motion: instant swap.
 */
export function RoutesTeaser({ routes, className }: RoutesTeaserProps) {
	const [active, setActive] = useState(0);
	const reduce = useReducedMotion();
	const current = routes[active] ?? routes[0];
	if (!current) return null;

	return (
		<div className={clsx('grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-16', className)}>
			<ol className="border-t border-[var(--color-line)]">
				{routes.map((route, i) => (
					<RouteRow key={route.slug} route={route} index={i} active={i === active} onActivate={setActive} />
				))}
			</ol>

			<div className="relative hidden lg:block">
				<div className="sticky top-28 image-placeholder aspect-[4/5] overflow-hidden">
					<AnimatePresence initial={false} mode="sync">
						<motion.div
							key={current.slug}
							className="absolute inset-0"
							initial={reduce ? false : IMAGE_INITIAL}
							animate={IMAGE_ANIMATE}
							exit={IMAGE_EXIT}
							transition={reduce ? FADE_TRANSITION : IMAGE_TRANSITION}
						>
							<SafeImage src={current.image} alt={current.title} fill sizes="40vw" className="object-cover" />
						</motion.div>
					</AnimatePresence>
					<div aria-hidden className="scrim-bottom absolute inset-x-0 bottom-0 h-1/2" />
					<div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
						<p className="heading-display text-2xl text-[var(--color-ink)]">{current.title}</p>
						<p className="tabular text-sm text-[var(--color-ink-muted)]">{current.distanceKm} km</p>
					</div>
				</div>
			</div>
		</div>
	);
}

interface RouteRowProps {
	route: RouteTeaserItem;
	index: number;
	active: boolean;
	onActivate: (index: number) => void;
}

const RouteRow = memo(function RouteRow({ route, index, active, onActivate }: RouteRowProps) {
	const activate = useCallback(() => onActivate(index), [onActivate, index]);
	return (
		<li className="border-b border-[var(--color-line)]">
			<Link
				href={`/journal/${route.slug}`}
				onPointerEnter={activate}
				onFocus={activate}
				className="group/row grid grid-cols-[auto_1fr_auto] items-center gap-4 py-6 sm:gap-6 lg:py-8"
			>
				<span className={clsx('tabular w-8 text-xs transition-colors duration-500', active ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink-dim)]')}>
					{String(index + 1).padStart(2, '0')}
				</span>
				<span className="min-w-0">
					<span
						className={clsx(
							'heading-display block truncate text-[clamp(1.4rem,3.4vw,2.75rem)] transition-[color,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
							active ? 'text-[var(--color-ink)] lg:translate-x-3' : 'text-[var(--color-ink-muted)]',
						)}
					>
						{route.title}
					</span>
					<span className="mt-2 block text-[0.66rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]">
						{route.region} · <span className="tabular normal-case tracking-normal">{route.duration}</span>
					</span>
				</span>
				<span className="flex items-center gap-4">
					<span className="tabular hidden text-sm text-[var(--color-ink-muted)] sm:inline">{route.distanceKm} km</span>
					<span className="image-placeholder relative h-14 w-14 overflow-hidden lg:hidden">
						<SafeImage src={route.image} alt="" fill sizes="56px" className="object-cover" />
					</span>
					<svg aria-hidden className={clsx('hidden h-3 w-4 transition-[transform,color] duration-500 lg:block', active ? 'translate-x-1 text-[var(--color-primary)]' : 'text-[var(--color-ink-dim)]')} viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.3">
						<path d="M0 6h14M9.5 1.5 14 6l-4.5 4.5" />
					</svg>
				</span>
			</Link>
		</li>
	);
});
