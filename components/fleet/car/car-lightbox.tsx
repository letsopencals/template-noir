'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { SafeImage } from '@/components/ui/safe-image';
import { useSmoothScroll } from '@/components/motion/smooth-scroll';
import { DURATION, EASE_OUT } from '@/components/motion/easing';

export interface LightboxImage {
	src: string;
	alt: string;
	label: string;
}

export interface CarLightboxProps {
	images: LightboxImage[];
	/** Open image index, or null when closed. */
	index: number | null;
	onIndexChange: (index: number | null) => void;
}

const SCRIM_INITIAL = { opacity: 0 } as const;
const SCRIM_ANIMATE = { opacity: 1 } as const;
const SCRIM_TRANSITION = { duration: DURATION.fast } as const;
const IMAGE_TRANSITION = { duration: DURATION.base, ease: EASE_OUT } as const;
const IMAGE_INITIAL = { opacity: 0, scale: 0.97 } as const;
const IMAGE_INITIAL_REDUCED = { opacity: 0 } as const;
const IMAGE_ANIMATE = { opacity: 1, scale: 1 } as const;

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen image viewer. Esc closes, ← / → step through, Tab is trapped
 * inside, focus returns to the opener on close, and Lenis pauses while open.
 */
export function CarLightbox({ images, index, onIndexChange }: CarLightboxProps) {
	const reduce = useReducedMotion();
	const lenis = useSmoothScroll();
	const dialogRef = useRef<HTMLDivElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const openerRef = useRef<HTMLElement | null>(null);
	const open = index !== null;
	const count = images.length;

	const close = useCallback(() => onIndexChange(null), [onIndexChange]);
	const step = useCallback(
		(dir: 1 | -1) => {
			if (index === null) return;
			onIndexChange((index + dir + count) % count);
		},
		[index, count, onIndexChange],
	);

	// Lock scroll, remember the opener, focus the close button.
	useEffect(() => {
		if (!open) return;
		openerRef.current = document.activeElement as HTMLElement | null;
		lenis?.stop();
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		closeRef.current?.focus();
		return () => {
			lenis?.start();
			document.body.style.overflow = prevOverflow;
			openerRef.current?.focus();
		};
	}, [open, lenis]);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				close();
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				step(1);
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				step(-1);
			} else if (e.key === 'Tab' && dialogRef.current) {
				const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
				if (nodes.length === 0) return;
				const first = nodes[0]!;
				const last = nodes[nodes.length - 1]!;
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		},
		[close, step],
	);

	const current = index !== null ? images[index] : undefined;

	return (
		<AnimatePresence>
			{open && current ? (
				<motion.div
					ref={dialogRef}
					role="dialog"
					aria-modal="true"
					aria-label={`Gallery: ${current.label}`}
					data-lenis-prevent
					onKeyDown={onKeyDown}
					className="fixed inset-0 z-[80] flex flex-col bg-black/95 backdrop-blur-sm"
					initial={SCRIM_INITIAL}
					animate={SCRIM_ANIMATE}
					exit={SCRIM_INITIAL}
					transition={SCRIM_TRANSITION}
				>
					<div className="flex items-center justify-between px-5 py-5 lg:px-10">
						<p className="eyebrow">
							<span className="tabular text-[var(--color-ink)]">{String(index! + 1).padStart(2, '0')}</span>
							<span className="tabular"> / {String(count).padStart(2, '0')}</span>
							<span className="ml-4">{current.label}</span>
						</p>
						<button
							ref={closeRef}
							type="button"
							onClick={close}
							aria-label="Close gallery"
							className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-[var(--color-line-strong)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--color-primary)]"
						>
							<svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
								<path d="M1 1l12 12M13 1L1 13" />
							</svg>
						</button>
					</div>

					<div className="relative flex-1" onClick={close}>
						<AnimatePresence initial={false} mode="popLayout">
							<motion.div
								key={current.src}
								className="image-placeholder absolute inset-x-5 inset-y-2 lg:inset-x-24"
								initial={reduce ? IMAGE_INITIAL_REDUCED : IMAGE_INITIAL}
								animate={IMAGE_ANIMATE}
								exit={IMAGE_INITIAL_REDUCED}
								transition={IMAGE_TRANSITION}
								onClick={(e) => e.stopPropagation()}
							>
								<SafeImage src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" />
							</motion.div>
						</AnimatePresence>
					</div>

					{count > 1 ? (
						<div className="flex items-center justify-center gap-3 px-5 py-6">
							<NavButton label="Previous image" onClick={() => step(-1)} dir={-1} />
							<div className="flex gap-2 px-4" aria-hidden>
								{images.map((img, i) => (
									<span
										key={img.src}
										className={i === index ? 'h-px w-8 bg-[var(--color-primary)]' : 'h-px w-4 bg-[var(--color-line-strong)]'}
									/>
								))}
							</div>
							<NavButton label="Next image" onClick={() => step(1)} dir={1} />
						</div>
					) : null}
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}

function NavButton({ label, onClick, dir }: { label: string; onClick: () => void; dir: 1 | -1 }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-[var(--color-line-strong)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--color-primary)]"
		>
			<svg aria-hidden width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2" className={dir === -1 ? 'rotate-180' : undefined}>
				<path d="M0 5h15M11 1l4 4-4 4" />
			</svg>
		</button>
	);
}
