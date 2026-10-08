'use client';

import { memo } from 'react';
import { clsx } from 'clsx';
import { STEP_LABELS, type BookingStep } from '@/lib/booking-constants';

interface StepProgressProps {
	steps: BookingStep[];
	current: BookingStep;
	completed: Record<BookingStep, boolean>;
	canEnter: (s: BookingStep) => boolean;
	onSelect: (s: BookingStep) => void;
}

/** Numbered step rail: mono index, hairline connectors, champagne for the current step. */
export const StepProgress = memo(function StepProgress({ steps, current, completed, canEnter, onSelect }: StepProgressProps) {
	const currentIndex = steps.indexOf(current);
	return (
		<ol data-lenis-prevent className="no-scrollbar -mx-1 flex items-center overflow-x-auto px-1">
			{steps.map((s, i) => {
				const isActive = s === current;
				const isDone = completed[s] && !isActive;
				return (
					<li key={s} className="flex shrink-0 items-center">
						<button
							type="button"
							disabled={!canEnter(s)}
							onClick={() => onSelect(s)}
							aria-current={isActive ? 'step' : undefined}
							className="flex items-center gap-2.5 py-2 pr-3 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
						>
							<span
								className={clsx(
									'tabular flex h-7 w-7 items-center justify-center border text-[0.7rem] transition-colors duration-300',
									isActive
										? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-black'
										: isDone
											? 'border-[var(--color-primary-dark)] text-[var(--color-primary)]'
											: 'border-[var(--color-line-strong)] text-[var(--color-ink-dim)]',
								)}
							>
								{isDone ? (
									<svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
										<path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="square" />
									</svg>
								) : (
									String(i + 1).padStart(2, '0')
								)}
							</span>
							<span
								className={clsx(
									'whitespace-nowrap text-[0.64rem] uppercase tracking-[0.22em]',
									isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-dim)]',
								)}
							>
								{STEP_LABELS[s]}
							</span>
						</button>
						{i < steps.length - 1 ? (
							<span
								aria-hidden
								className={clsx('mr-3 h-px w-6 shrink-0', i < currentIndex ? 'bg-[var(--color-primary-dark)]' : 'bg-[var(--color-line-strong)]')}
							/>
						) : null}
					</li>
				);
			})}
		</ol>
	);
});
