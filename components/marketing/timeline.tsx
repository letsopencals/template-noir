'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { Reveal } from '@/components/motion/reveal';

export interface TimelineStep {
	index: string;
	title: string;
	body: string;
}

const OFFSET = ['start 75%', 'end 55%'] as const;
const SPRING = { stiffness: 120, damping: 30, restDelta: 0.001 } as const;

/**
 * Vertical process timeline. A champagne line fills down the rail as the
 * section scrolls past; each step rises in. Reduced motion: the rail is full.
 */
export function Timeline({ steps, className }: { steps: readonly TimelineStep[]; className?: string }) {
	const ref = useRef<HTMLOListElement>(null);
	const reduce = useReducedMotion();
	const { scrollYProgress } = useScroll({ target: ref, offset: [...OFFSET] });
	const fill = useSpring(scrollYProgress, SPRING);

	return (
		<ol ref={ref} className={clsx('relative', className)}>
			<span aria-hidden className="absolute bottom-0 left-[11px] top-0 w-px bg-[var(--color-line)] lg:left-1/2" />
			<motion.span
				aria-hidden
				className="absolute bottom-0 left-[11px] top-0 w-px origin-top bg-[var(--color-primary)] lg:left-1/2"
				style={reduce ? undefined : { scaleY: fill }}
			/>
			{steps.map((step, i) => {
				const right = i % 2 === 1;
				return (
					<li key={step.index} className="relative grid pb-16 pl-12 last:pb-0 lg:grid-cols-2 lg:gap-24 lg:pb-28 lg:pl-0">
						<span aria-hidden className="absolute left-[5px] top-1.5 h-[13px] w-[13px] rotate-45 border border-[var(--color-primary)] bg-[var(--color-bg)] lg:left-1/2 lg:-translate-x-1/2" />
						<Reveal className={clsx(right ? 'lg:col-start-2' : 'lg:text-right')}>
							<p className="tabular mb-4 text-sm text-[var(--color-primary)]">{step.index}</p>
							<h3 className="heading-display mb-5 text-[clamp(1.75rem,3.6vw,3rem)] text-[var(--color-ink)]">{step.title}</h3>
							<p className={clsx('max-w-md leading-relaxed text-[var(--color-ink-muted)]', !right && 'lg:ml-auto')}>{step.body}</p>
						</Reveal>
					</li>
				);
			})}
		</ol>
	);
}
