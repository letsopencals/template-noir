'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { siteConfig } from '@/lib/site-config';
import { useSmoothScroll } from '@/components/motion/smooth-scroll';
import { EASE_OUT } from '@/components/motion/easing';

const PANEL: Variants = {
	hidden: { clipPath: 'inset(0% 0% 100% 0%)' },
	visible: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.8, ease: EASE_OUT } },
	exit: { clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.6, ease: EASE_OUT, delay: 0.1 } },
};
const PANEL_REDUCED: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: 0.2 } },
	exit: { opacity: 0, transition: { duration: 0.2 } },
};
const LIST: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } },
	exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};
const ITEM: Variants = {
	hidden: { y: '110%' },
	visible: { y: '0%', transition: { duration: 0.9, ease: EASE_OUT } },
	exit: { y: '110%', transition: { duration: 0.4, ease: EASE_OUT } },
};
const FADE: Variants = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT, delay: 0.55 } },
	exit: { opacity: 0, transition: { duration: 0.2 } },
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface MenuOverlayProps {
	open: boolean;
	onClose: () => void;
}

/**
 * Full-screen menu: oversized expanded links with index numbers, secondary
 * links and the concierge contact block. Closes on route change and Escape,
 * traps focus while open, and pauses smooth scroll / body scroll.
 */
export function MenuOverlay({ open, onClose }: MenuOverlayProps) {
	const pathname = usePathname();
	const reduce = useReducedMotion();
	const lenis = useSmoothScroll();
	const panelRef = useRef<HTMLDivElement>(null);
	const lastPath = useRef(pathname);

	// Close when the route changes.
	useEffect(() => {
		if (lastPath.current !== pathname) {
			lastPath.current = pathname;
			onClose();
		}
	}, [pathname, onClose]);

	// Scroll lock, Escape, focus trap, focus restore.
	useEffect(() => {
		if (!open) return;
		const previouslyFocused = document.activeElement as HTMLElement | null;
		lenis?.stop();
		document.body.style.overflow = 'hidden';

		const focusFirst = window.setTimeout(() => {
			panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
		}, 50);

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				onClose();
				return;
			}
			if (e.key !== 'Tab' || !panelRef.current) return;
			const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
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
		};
		document.addEventListener('keydown', onKey);

		return () => {
			window.clearTimeout(focusFirst);
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = '';
			lenis?.start();
			previouslyFocused?.focus?.();
		};
	}, [open, onClose, lenis]);

	const links = [...siteConfig.nav, siteConfig.navCta];

	return (
		<AnimatePresence>
			{open ? (
				<motion.div
					id="site-menu"
					ref={panelRef}
					role="dialog"
					aria-modal="true"
					aria-label="Site menu"
					data-lenis-prevent
					className="fixed inset-0 z-[55] overflow-y-auto bg-[var(--color-bg-deep)]"
					variants={reduce ? PANEL_REDUCED : PANEL}
					initial="hidden"
					animate="visible"
					exit="exit"
				>
					<div className="mx-auto grid min-h-full max-w-[1600px] gap-14 px-5 pb-12 pt-32 lg:grid-cols-[1fr_340px] lg:px-10 lg:pt-36">
						<motion.ul variants={LIST} className="flex flex-col">
							{links.map((link, i) => (
								<li key={link.href} className="overflow-hidden border-b border-[var(--color-line)]">
									<motion.div variants={reduce ? undefined : ITEM}>
										<Link
											href={link.href}
											onClick={onClose}
											className="group flex items-baseline gap-5 py-3 lg:gap-8 lg:py-4"
										>
											<span className="tabular w-8 text-xs text-[var(--color-ink-dim)] transition-colors group-hover:text-[var(--color-primary)]">
												{String(i + 1).padStart(2, '0')}
											</span>
											<span className="heading-display text-[clamp(2.2rem,6.5vw,5.5rem)] text-[var(--color-ink)] transition-[color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 group-hover:text-[var(--color-primary-bright)]">
												{link.label}
											</span>
										</Link>
									</motion.div>
								</li>
							))}
						</motion.ul>

						<motion.aside variants={FADE} className="flex flex-col justify-end gap-10 text-sm">
							<ul className="flex flex-wrap gap-x-6 gap-y-3">
								{siteConfig.menuSecondary.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											onClick={onClose}
											className="link-underline text-[0.7rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>

							<div className="space-y-2">
								<p className="eyebrow">Concierge</p>
								<a
									href={siteConfig.contact.whatsappHref}
									target="_blank"
									rel="noopener noreferrer"
									className="block text-lg text-[var(--color-ink)] hover:text-[var(--color-primary-bright)]"
								>
									WhatsApp {siteConfig.contact.whatsapp}
								</a>
								<a href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="block text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
									{siteConfig.contact.phone}
								</a>
								<a href={`mailto:${siteConfig.contact.email}`} className="block text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
									{siteConfig.contact.email}
								</a>
							</div>

							<div className="space-y-2">
								<p className="eyebrow">Garage</p>
								<p className="whitespace-pre-line text-[var(--color-ink-muted)]">{siteConfig.contact.address}</p>
								{siteConfig.contact.hours.map((h) => (
									<p key={h.label} className="flex justify-between gap-4 text-[var(--color-ink-dim)]">
										<span>{h.label}</span>
										<span className="tabular text-[var(--color-ink-muted)]">{h.value}</span>
									</p>
								))}
							</div>
						</motion.aside>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
