'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { EASE_OUT } from '@/components/motion/easing';

export interface FloatingPanelProps {
	open: boolean;
	/** Element the panel is placed against (usually the trigger or its field group). */
	anchorRef: RefObject<HTMLElement | null>;
	/** Outside click, Escape, or the anchor scrolling out of view. */
	onClose(): void;
	/** Preferred width in px (capped to the viewport). Default: the anchor's width. */
	width?: number;
	/** Horizontal alignment against the anchor. Default 'start'. */
	align?: 'start' | 'end';
	/** Gap between anchor and panel in px. Default 8. */
	offset?: number;
	className?: string;
	/** id for aria-controls; triggers marked `data-panel-for={id}` don't count as outside clicks. */
	id?: string;
	role?: string;
	'aria-label'?: string;
	/** Selector inside the panel to focus on open. */
	initialFocus?: string;
	children: ReactNode;
}

const VIEWPORT_MARGIN = 12;
const TRANSITION: Transition = { duration: 0.28, ease: EASE_OUT };
const NO_TRANSITION: Transition = { duration: 0 };
const ANIMATE = { opacity: 1, y: 0 } as const;
const FADE = { opacity: 0 } as const;
const OFF_BELOW = { opacity: 0, y: -8 } as const;
const OFF_ABOVE = { opacity: 0, y: 8 } as const;
const OFFSCREEN: CSSProperties = { top: -9999, left: -9999 };

const noopSubscribe = () => () => {};
/** False on the server and while hydrating, true after: portals can't hydrate. */
function useMounted(): boolean {
	return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

type Placement = { style: CSSProperties; side: 'below' | 'above' };

/**
 * Popover surface for desktop pickers (date range, listbox). Portalled to
 * <body> with fixed positioning, because the hero and the sticky fleet bar
 * clip overflow. Opens below the anchor and flips above when there's more room
 * there; follows the anchor on scroll and resize. Closes on outside pointer
 * down and Escape. `data-lenis-prevent` lets long lists scroll natively.
 * z-[62]: over the header (z-60), under the cart drawer (z-65).
 */
export function FloatingPanel({
	open,
	anchorRef,
	onClose,
	width,
	align = 'start',
	offset = 8,
	className,
	id,
	role,
	'aria-label': ariaLabel,
	initialFocus,
	children,
}: FloatingPanelProps) {
	const reduce = useReducedMotion();
	const mounted = useMounted();
	const panelRef = useRef<HTMLDivElement>(null);
	/** Whatever had focus when the panel opened (the trigger), restored on Escape. */
	const openerRef = useRef<HTMLElement | null>(null);
	const [placement, setPlacement] = useState<Placement | null>(null);

	const place = useCallback(() => {
		const anchor = anchorRef.current;
		if (!anchor) return;
		const r = anchor.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const w = Math.min(width ?? r.width, vw - VIEWPORT_MARGIN * 2);
		let left = align === 'end' ? r.right - w : r.left;
		left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - w - VIEWPORT_MARGIN));
		const below = vh - r.bottom - offset - VIEWPORT_MARGIN;
		const above = r.top - offset - VIEWPORT_MARGIN;
		const panelHeight = panelRef.current?.offsetHeight ?? 0;
		const side = panelHeight > below && above > below ? 'above' : 'below';
		const maxHeight = Math.max(160, side === 'below' ? below : above);
		const style: CSSProperties =
			side === 'below'
				? { top: r.bottom + offset, left, width: w, maxHeight }
				: { bottom: vh - r.top + offset, left, width: w, maxHeight };
		setPlacement({ style, side });
	}, [anchorRef, width, align, offset]);

	// Measure once on open (and again after the panel has a height, for flipping).
	useLayoutEffect(() => {
		if (!open) {
			setPlacement(null);
			return;
		}
		if (document.activeElement instanceof HTMLElement && !panelRef.current?.contains(document.activeElement)) {
			openerRef.current = document.activeElement;
		}
		place();
		const raf = requestAnimationFrame(() => {
			place();
			if (initialFocus) panelRef.current?.querySelector<HTMLElement>(initialFocus)?.focus({ preventScroll: true });
		});
		return () => cancelAnimationFrame(raf);
	}, [open, place, initialFocus]);

	useEffect(() => {
		if (!open) return;
		let raf = 0;
		const schedule = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(place);
		};
		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as Node;
			if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
			// Other triggers of this same panel (e.g. Return while Pick-up opened it) switch it, not close it.
			if (id && target instanceof Element && target.closest(`[data-panel-for="${id}"]`)) return;
			onClose();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			// Back to the trigger, since the panel lives at the end of <body>.
			const anchor = anchorRef.current;
			const trigger = openerRef.current?.isConnected && openerRef.current !== document.body ? openerRef.current : anchor?.matches('button') ? anchor : anchor?.querySelector('button');
			trigger?.focus({ preventScroll: true });
			onClose();
		};
		window.addEventListener('scroll', schedule, true);
		window.addEventListener('resize', schedule);
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKey);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('scroll', schedule, true);
			window.removeEventListener('resize', schedule);
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [open, place, onClose, anchorRef, id]);

	if (!mounted) return null;

	const off = placement?.side === 'above' ? OFF_ABOVE : OFF_BELOW;

	return createPortal(
		<AnimatePresence>
			{open ? (
				<motion.div
					ref={panelRef}
					id={id}
					role={role}
					aria-label={ariaLabel}
					data-lenis-prevent
					initial={reduce ? false : off}
					animate={ANIMATE}
					exit={reduce ? FADE : off}
					transition={reduce ? NO_TRANSITION : TRANSITION}
					style={{ position: 'fixed', ...(placement?.style ?? OFFSCREEN) }}
					className={clsx(
						'z-[62] overflow-auto rounded-[2px] border border-[var(--color-line-strong)] bg-[rgba(11,11,12,0.96)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl',
						className,
					)}
				>
					{children}
				</motion.div>
			) : null}
		</AnimatePresence>,
		document.body,
	);
}
