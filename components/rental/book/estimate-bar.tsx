'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { Button } from '@/components/ui/button';
import { EASE_OUT } from '@/components/motion/easing';
import { AnimatedNumber } from './animated-number';
import { formatCountdown, formatMoney } from './money';
import type { BookTotals } from './summary-rail';

interface EstimateBarProps {
	totals: BookTotals;
	currency: string;
	depositAed: number | null;
	timeRemaining: number | null;
	ctaLabel: string;
	ctaDisabled: boolean;
	onCta: () => void;
}

const BAR_INITIAL = { y: '100%' };
const BAR_ANIMATE = { y: 0 };
const BAR_TRANSITION = { duration: 0.7, ease: EASE_OUT, delay: 0.3 };
const NO_TRANSITION = { duration: 0 };

/** Mobile/tablet sticky estimate with the next action. Hidden on `lg` (the rail shows it). */
export const EstimateBar = memo(function EstimateBar({
	totals,
	currency,
	depositAed,
	timeRemaining,
	ctaLabel,
	ctaDisabled,
	onCta,
}: EstimateBarProps) {
	const reduce = useReducedMotion();
	const money = (n: number) => formatMoney(n, currency);
	return (
		<motion.div
			initial={reduce ? false : BAR_INITIAL}
			animate={BAR_ANIMATE}
			transition={reduce ? NO_TRANSITION : BAR_TRANSITION}
			className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line-strong)] bg-[var(--color-bg)]/95 backdrop-blur lg:hidden"
			style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
		>
			<div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3">
				<div className="min-w-0 flex-1">
					<p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">
						{totals.days > 0 ? `${totals.days} ${totals.days === 1 ? 'day' : 'days'}` : 'Pick dates'}
						{timeRemaining !== null ? <span className="tabular"> · held {formatCountdown(timeRemaining)}</span> : null}
					</p>
					<AnimatedNumber value={totals.total} format={money} className="tabular block text-lg text-[var(--color-primary)]" />
					{depositAed ? (
						<p className="truncate text-[0.65rem] text-[var(--color-ink-dim)]">+ {money(depositAed)} deposit held at handover</p>
					) : null}
				</div>
				<Button variant="primary" size="md" onClick={onCta} disabled={ctaDisabled} className="shrink-0">
					{ctaLabel}
				</Button>
			</div>
		</motion.div>
	);
});
