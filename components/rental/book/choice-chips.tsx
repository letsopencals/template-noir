'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';

interface ChoiceOption<T extends string> {
	value: T;
	label: string;
	hint?: string;
	disabled?: boolean;
}

interface ChoiceChipsProps<T extends string> {
	/** Unique per page: drives the shared-layout highlight. */
	layoutId: string;
	label: string;
	options: ChoiceOption<T>[];
	value: T | null;
	onChange: (v: T) => void;
	/** Grid columns from `sm` up. */
	columns?: 2 | 3;
	/** Mono digits for time windows. */
	tabular?: boolean;
}

const HIGHLIGHT_TRANSITION = { type: 'spring', stiffness: 460, damping: 40, mass: 0.7 } as const;
const NO_TRANSITION = { duration: 0 };

/**
 * Single-choice chips (radio group). The champagne highlight slides between
 * options with a shared layout animation; selected text turns black on it.
 */
function ChoiceChipsInner<T extends string>({
	layoutId,
	label,
	options,
	value,
	onChange,
	columns = 3,
	tabular = false,
}: ChoiceChipsProps<T>) {
	const reduce = useReducedMotion();
	return (
		<div
			role="radiogroup"
			aria-label={label}
			className={clsx('grid grid-cols-2 gap-2', columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}
		>
			{options.map((o) => {
				const selected = o.value === value;
				return (
					<button
						key={o.value}
						type="button"
						role="radio"
						aria-checked={selected}
						disabled={o.disabled}
						onClick={() => onChange(o.value)}
						className={clsx(
							'relative isolate border px-3 py-3 text-left transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-35',
							'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
							selected
								? 'border-[var(--color-primary)] text-black'
								: 'border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary-dark)]',
						)}
					>
						{selected ? (
							<motion.span
								layoutId={reduce ? undefined : layoutId}
								transition={reduce ? NO_TRANSITION : HIGHLIGHT_TRANSITION}
								className="absolute inset-0 -z-10 bg-[var(--color-primary)]"
								aria-hidden
							/>
						) : null}
						<span className={clsx('block text-sm', tabular ? 'tabular' : '')}>{o.label}</span>
						{o.hint ? (
							<span
								className={clsx(
									'mt-0.5 block text-[0.68rem]',
									selected ? 'text-black/70' : 'text-[var(--color-ink-dim)]',
								)}
							>
								{o.hint}
							</span>
						) : null}
					</button>
				);
			})}
		</div>
	);
}

export const ChoiceChips = memo(ChoiceChipsInner) as typeof ChoiceChipsInner;
