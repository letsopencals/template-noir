'use client';

import { forwardRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { EASE_OUT } from '@/components/motion/easing';

export type SectionState = 'locked' | 'open' | 'done';

interface BookSectionProps {
	id: string;
	index: string;
	title: string;
	state: SectionState;
	/** One-line recap shown in the header once the section is done. */
	summary?: ReactNode;
	/** Shown in place of the body while locked. */
	lockedHint?: string;
	children: ReactNode;
}

const BODY_INITIAL = { height: 0, opacity: 0 };
const BODY_ANIMATE = { height: 'auto', opacity: 1 };
const BODY_EXIT = { height: 0, opacity: 0 };
const BODY_TRANSITION = { height: { duration: 0.7, ease: EASE_OUT }, opacity: { duration: 0.45, ease: EASE_OUT, delay: 0.1 } };
const NO_TRANSITION = { duration: 0 };

/**
 * One numbered step of the /book page. Locked steps show their header dimmed
 * with a hint; when a step unlocks, its body unfolds (height + fade).
 * Done steps keep their body open, with a recap beside the title.
 */
export const BookSection = forwardRef<HTMLElement, BookSectionProps>(function BookSection(
	{ id, index, title, state, summary, lockedHint, children },
	ref,
) {
	const reduce = useReducedMotion();
	const locked = state === 'locked';

	return (
		<section
			ref={ref}
			id={id}
			aria-labelledby={`${id}-title`}
			className="scroll-mt-28 border-t border-[var(--color-line)] py-10 sm:py-12"
		>
			<header className="flex items-baseline gap-5">
				<span
					className={clsx(
						'tabular text-sm transition-colors duration-500',
						locked ? 'text-[var(--color-ink-dim)]' : 'text-[var(--color-primary)]',
					)}
				>
					{index}
				</span>
				<div className="min-w-0 flex-1">
					<h2
						id={`${id}-title`}
						className={clsx(
							'heading-display text-[clamp(1.25rem,2.4vw,1.9rem)] transition-colors duration-500',
							locked ? 'text-[var(--color-ink-dim)]' : 'text-[var(--color-ink)]',
						)}
					>
						{title}
					</h2>
					{state === 'done' && summary ? (
						<p className="mt-2 truncate text-sm text-[var(--color-ink-muted)]">{summary}</p>
					) : null}
					{locked && lockedHint ? <p className="mt-2 text-sm text-[var(--color-ink-dim)]">{lockedHint}</p> : null}
				</div>
				<StateMark state={state} />
			</header>

			<AnimatePresence initial={false}>
				{locked ? null : (
					<motion.div
						key="body"
						initial={reduce ? false : BODY_INITIAL}
						animate={BODY_ANIMATE}
						exit={reduce ? undefined : BODY_EXIT}
						transition={reduce ? NO_TRANSITION : BODY_TRANSITION}
						className="overflow-hidden"
					>
						{/* Padding inside the animated box so height animates cleanly; overflow visible for focus rings. */}
						<div className="px-px pb-1 pt-8 sm:pl-10">{children}</div>
					</motion.div>
				)}
			</AnimatePresence>
		</section>
	);
});

function StateMark({ state }: { state: SectionState }) {
	if (state === 'done') {
		return (
			<span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--color-primary)] text-black" aria-label="Done">
				<svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
					<path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="square" />
				</svg>
			</span>
		);
	}
	if (state === 'locked') {
		return (
			<span className="flex h-6 w-6 shrink-0 items-center justify-center text-[var(--color-ink-dim)]" aria-label="Locked">
				<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden>
					<rect x="3.5" y="7" width="9" height="6.5" />
					<path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
				</svg>
			</span>
		);
	}
	return <span className="h-6 w-6 shrink-0 border border-[var(--color-primary)]" aria-hidden />;
}
