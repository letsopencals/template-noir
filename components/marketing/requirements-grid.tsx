import { clsx } from 'clsx';
import { Reveal } from '@/components/motion/reveal';

export interface Requirement {
	title: string;
	body: string;
}

/** Numbered grid of driver requirements (age, licence, IDP, ID, deposit). */
export function RequirementsGrid({ items, className }: { items: readonly Requirement[]; className?: string }) {
	return (
		<ol className={clsx('grid gap-px bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-3', className)}>
			{items.map((item, i) => (
				<Reveal as="li" key={item.title} delay={(i % 3) * 0.08} className="flex flex-col bg-[var(--color-bg)] p-6 sm:p-8 lg:min-h-[260px]">
					<span className="tabular mb-10 text-xs text-[var(--color-primary)]">{String(i + 1).padStart(2, '0')}</span>
					<h3 className="heading-display mb-4 text-lg text-[var(--color-ink)]">{item.title}</h3>
					<p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">{item.body}</p>
				</Reveal>
			))}
		</ol>
	);
}
