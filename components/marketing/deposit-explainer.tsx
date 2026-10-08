import Link from 'next/link';
import { clsx } from 'clsx';
import { Reveal } from '@/components/motion/reveal';
import { formatWholePrice } from './format';

export interface DepositRow {
	slug: string;
	title: string;
	depositAed: number;
	minAge: number;
}

export interface DepositExplainerProps {
	steps: ReadonlyArray<{ title: string; body: string }>;
	rows: DepositRow[];
	className?: string;
}

/**
 * The security deposit: three steps (held at handover → never online →
 * released after return) beside a dotted-leader list of the hold per car.
 */
export function DepositExplainer({ steps, rows, className }: DepositExplainerProps) {
	return (
		<div className={clsx('grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20', className)}>
			<ol className="space-y-px bg-[var(--color-line)]">
				{steps.map((step, i) => (
					<Reveal as="li" key={step.title} delay={i * 0.1} className="grid grid-cols-[auto_1fr] gap-6 bg-[var(--color-bg)] py-7">
						<span className="tabular pt-1 text-sm text-[var(--color-primary)]">{String(i + 1).padStart(2, '0')}</span>
						<div>
							<h3 className="heading-display mb-3 text-lg text-[var(--color-ink)]">{step.title}</h3>
							<p className="max-w-md text-sm leading-relaxed text-[var(--color-ink-muted)]">{step.body}</p>
						</div>
					</Reveal>
				))}
			</ol>

			{rows.length > 0 ? (
				<Reveal delay={0.15}>
					<div className="mb-5 flex items-center justify-between text-[0.62rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]">
						<span>Car · min. age</span>
						<span>Deposit hold</span>
					</div>
					<ul className="border-t border-[var(--color-line)]">
						{rows.map((row) => (
							<li key={row.slug}>
								<Link href={`/fleet/${row.slug}`} className="group/dep flex items-baseline py-3 text-sm">
									<span className="text-[var(--color-ink)] transition-colors group-hover/dep:text-[var(--color-primary-bright)]">{row.title}</span>
									<span className="tabular ml-2 text-xs text-[var(--color-ink-dim)]">{row.minAge}+</span>
									<span aria-hidden className="leader-line" />
									<span className="tabular text-[var(--color-ink-muted)]">{formatWholePrice(row.depositAed, 'AED')}</span>
								</Link>
							</li>
						))}
					</ul>
				</Reveal>
			) : null}
		</div>
	);
}
