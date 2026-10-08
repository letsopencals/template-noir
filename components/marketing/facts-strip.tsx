import { clsx } from 'clsx';
import { CountUp } from '@/components/motion/count-up';

export interface Fact {
	label: string;
	/** Numbers count up; strings render as-is. */
	value: number | string;
	/** Small note under the value. */
	note?: string;
}

export interface FactsStripProps {
	facts: Fact[];
	className?: string;
}

/** Hairline-divided strip of short facts (numbers count up once in view). */
export function FactsStrip({ facts, className }: FactsStripProps) {
	return (
		<dl className={clsx('grid grid-cols-2 gap-px border-y border-[var(--color-line)] bg-[var(--color-line)] lg:grid-cols-4', className)}>
			{facts.map((f) => (
				<div key={f.label} className="flex flex-col gap-4 bg-[var(--color-bg)] px-5 py-7 sm:px-7 sm:py-9">
					<dt className="text-[0.6rem] uppercase tracking-[0.26em] text-[var(--color-ink-dim)]">{f.label}</dt>
					<dd className="text-[var(--color-ink)]">
						{typeof f.value === 'number' ? (
							<span className="heading-display text-[clamp(2rem,4.5vw,3.5rem)] leading-none">
								<CountUp value={f.value} />
							</span>
						) : (
							<span className="tabular text-base leading-snug sm:text-lg">{f.value}</span>
						)}
						{f.note ? <span className="mt-2 block text-xs text-[var(--color-ink-muted)]">{f.note}</span> : null}
					</dd>
				</div>
			))}
		</dl>
	);
}
