import { clsx } from 'clsx';
import { Reveal } from '@/components/motion/reveal';

export interface IncludedListProps {
	included: readonly string[];
	notIncluded: readonly string[];
	className?: string;
}

/** Two-column "Included / Not included" spec sheet. */
export function IncludedList({ included, notIncluded, className }: IncludedListProps) {
	return (
		<div className={clsx('grid gap-px bg-[var(--color-line)] md:grid-cols-2', className)}>
			<Column title="Included" items={included} mark="+" accent />
			<Column title="Not included" items={notIncluded} mark="–" />
		</div>
	);
}

function Column({ title, items, mark, accent }: { title: string; items: readonly string[]; mark: string; accent?: boolean }) {
	return (
		<div className="bg-[var(--color-bg)] p-6 sm:p-10">
			<p className={clsx('eyebrow mb-8', accent && '!text-[var(--color-primary)]')}>{title}</p>
			<ul>
				{items.map((item, i) => (
					<Reveal as="li" key={item} delay={i * 0.06} className="flex gap-5 border-t border-[var(--color-line)] py-4 text-[var(--color-ink)]">
						<span aria-hidden className={clsx('tabular w-4 shrink-0', accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink-dim)]')}>
							{mark}
						</span>
						<span className={accent ? undefined : 'text-[var(--color-ink-muted)]'}>{item}</span>
					</Reveal>
				))}
			</ul>
		</div>
	);
}
