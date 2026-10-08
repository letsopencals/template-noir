'use client';

import { memo, useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { formatWholePrice } from '@/components/marketing/format';
import type { HomeCar } from './types';

export interface FleetCarouselProps {
	cars: HomeCar[];
}

const DRAG_THRESHOLD = 5;
/** Aligns the first card with the 1600px page container. */
const TRACK_PAD = 'px-5 scroll-px-5 lg:px-[max(2.5rem,calc((100vw-1600px)/2+2.5rem))] lg:scroll-px-[max(2.5rem,calc((100vw-1600px)/2+2.5rem))]';

interface DragState {
	active: boolean;
	moved: boolean;
	startX: number;
	startLeft: number;
	pointerId: number;
}

/**
 * Horizontal fleet carousel: native scroll-snap (touch and trackpad swipe),
 * mouse drag-to-scroll, arrow buttons and a champagne progress hairline.
 * `data-lenis-prevent-horizontal` hands sideways gestures to the browser while
 * Lenis keeps smoothing vertical page scroll over the track.
 */
export function FleetCarousel({ cars }: FleetCarouselProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const drag = useRef<DragState>({ active: false, moved: false, startX: 0, startLeft: 0, pointerId: -1 });
	const [dragging, setDragging] = useState(false);
	const [active, setActive] = useState(0);
	const reduce = useReducedMotion();
	const { scrollXProgress } = useScroll({ container: trackRef });

	useMotionValueEvent(scrollXProgress, 'change', (p) => {
		setActive(Math.min(cars.length - 1, Math.max(0, Math.round(p * (cars.length - 1)))));
	});

	const step = useCallback(
		(dir: 1 | -1) => {
			const track = trackRef.current;
			const first = track?.firstElementChild as HTMLElement | null;
			if (!track || !first) return;
			const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
			track.scrollBy({ left: dir * (first.offsetWidth + gap), behavior: reduce ? 'auto' : 'smooth' });
		},
		[reduce],
	);
	const prev = useCallback(() => step(-1), [step]);
	const next = useCallback(() => step(1), [step]);

	const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		if (e.pointerType !== 'mouse' || e.button !== 0 || !trackRef.current) return;
		drag.current = { active: true, moved: false, startX: e.clientX, startLeft: trackRef.current.scrollLeft, pointerId: e.pointerId };
	}, []);

	const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		const d = drag.current;
		const track = trackRef.current;
		if (!d.active || !track) return;
		const dx = e.clientX - d.startX;
		if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) {
			d.moved = true;
			setDragging(true);
			track.setPointerCapture(d.pointerId);
		}
		if (d.moved) track.scrollLeft = d.startLeft - dx;
	}, []);

	const endDrag = useCallback(() => {
		const d = drag.current;
		if (!d.active) return;
		d.active = false;
		if (d.moved) {
			setDragging(false);
			trackRef.current?.releasePointerCapture?.(d.pointerId);
		}
	}, []);

	// Swallow the click that ends a drag so the card link doesn't navigate.
	const onClickCapture = useCallback((e: React.MouseEvent) => {
		if (drag.current.moved) {
			e.preventDefault();
			e.stopPropagation();
			drag.current.moved = false;
		}
	}, []);

	return (
		<div>
			<div
				ref={trackRef}
				data-lenis-prevent-horizontal
				role="region"
				aria-roledescription="carousel"
				aria-label="Fleet"
				tabIndex={0}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={endDrag}
				onPointerCancel={endDrag}
				onPointerLeave={endDrag}
				onClickCapture={onClickCapture}
				className={clsx(
					'no-scrollbar flex gap-4 overflow-x-auto overscroll-x-contain pb-2 outline-none lg:gap-6',
					TRACK_PAD,
					dragging ? 'cursor-grabbing snap-none select-none' : 'cursor-grab snap-x snap-mandatory',
				)}
			>
				{cars.map((car, i) => (
					<FleetCard key={car.slug} car={car} index={i} />
				))}
			</div>

			<div className="mx-auto mt-10 flex max-w-[1600px] items-center gap-6 px-5 lg:px-10">
				<p className="tabular w-16 shrink-0 text-xs text-[var(--color-ink-muted)]">
					<span className="text-[var(--color-ink)]">{String(active + 1).padStart(2, '0')}</span> / {String(cars.length).padStart(2, '0')}
				</p>
				<div className="relative h-px flex-1 bg-[var(--color-line)]">
					<motion.div className="absolute inset-0 origin-left bg-[var(--color-primary)]" style={{ scaleX: scrollXProgress }} />
				</div>
				<div className="flex gap-2">
					<ArrowButton dir="prev" onClick={prev} />
					<ArrowButton dir="next" onClick={next} />
				</div>
			</div>
		</div>
	);
}

const FleetCard = memo(function FleetCard({ car, index }: { car: HomeCar; index: number }) {
	return (
		<Link
			href={`/fleet/${car.slug}`}
			draggable={false}
			className="group/card relative flex w-[82vw] shrink-0 snap-start flex-col sm:w-[58vw] lg:w-[38vw] xl:w-[31vw] 2xl:w-[480px]"
		>
			<div className="image-placeholder relative aspect-[16/10] overflow-hidden border border-[var(--color-line)] transition-colors duration-500 group-hover/card:border-[var(--color-line-strong)]">
				<SafeImage
					src={car.image}
					alt={car.title}
					fill
					draggable={false}
					sizes="(min-width:1536px) 480px, (min-width:1024px) 38vw, 82vw"
					className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.045]"
				/>
				<span className="tabular absolute left-4 top-4 text-[0.7rem] text-[var(--color-ink-muted)]">{String(index + 1).padStart(2, '0')}</span>
				{car.categoryLabel ? <span className="chip absolute right-4 top-4 bg-black/40 backdrop-blur-sm">{car.categoryLabel}</span> : null}
			</div>
			<div className="flex items-end justify-between gap-4 pt-5">
				<div className="min-w-0">
					<h3 className="heading-display truncate text-lg text-[var(--color-ink)] sm:text-xl">{car.title}</h3>
					{car.pricePerDay !== null ? (
						<p className="mt-2 text-sm text-[var(--color-ink-muted)]">
							from <span className="tabular text-[var(--color-ink)]">{formatWholePrice(car.pricePerDay, car.currency)}</span> / day
						</p>
					) : car.tagline ? (
						<p className="mt-2 line-clamp-1 text-sm text-[var(--color-ink-muted)]">{car.tagline}</p>
					) : null}
				</div>
				<span
					aria-hidden
					className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--color-line-strong)] text-[var(--color-ink)] transition-colors duration-500 group-hover/card:border-[var(--color-primary)] group-hover/card:bg-[var(--color-primary)] group-hover/card:text-black"
				>
					<svg className="h-3 w-4" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.3">
						<path d="M0 6h14M9.5 1.5 14 6l-4.5 4.5" />
					</svg>
				</span>
			</div>
		</Link>
	);
});

const ArrowButton = memo(function ArrowButton({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={dir === 'prev' ? 'Previous car' : 'Next car'}
			className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-[var(--color-line-strong)] text-[var(--color-ink)] transition-colors duration-300 hover:border-[var(--color-primary)] hover:text-[var(--color-primary-bright)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--color-primary)]"
		>
			<svg className={clsx('h-3 w-4', dir === 'prev' && 'rotate-180')} viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.3">
				<path d="M0 6h14M9.5 1.5 14 6l-4.5 4.5" />
			</svg>
		</button>
	);
});
