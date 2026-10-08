import { clsx } from 'clsx';
import { Reveal } from '@/components/motion/reveal';

/** Short policy panel: heading + numbered points, on a raised surface. */
export function PolicyBlock({ heading, points, className, children }: { heading: string; points: readonly string[]; className?: string; children?: React.ReactNode }) {
	return (
		<Reveal className={clsx('border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-10 lg:p-14', className)}>
			<h3 className="heading-display mb-8 text-[clamp(1.4rem,2.6vw,2.2rem)] text-[var(--color-ink)]">{heading}</h3>
			<ol className="grid gap-6 md:grid-cols-3 md:gap-10">
				{points.map((p, i) => (
					<li key={p} className="border-t border-[var(--color-line-strong)] pt-5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
						<span className="tabular mb-3 block text-xs text-[var(--color-primary)]">{String(i + 1).padStart(2, '0')}</span>
						{p}
					</li>
				))}
			</ol>
			{children}
		</Reveal>
	);
}
