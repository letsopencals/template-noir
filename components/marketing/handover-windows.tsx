import { clsx } from 'clsx';
import { Reveal } from '@/components/motion/reveal';

/** The selectable two-hour handover windows as a spec-plate grid. */
export function HandoverWindows({ windows, hours, className }: { windows: readonly string[]; hours?: string; className?: string }) {
	return (
		<div className={className}>
			<ul className="grid grid-cols-2 gap-px bg-[var(--color-line)] sm:grid-cols-3">
				{windows.map((w, i) => {
					const [start, end] = w.split('–');
					return (
						<Reveal as="li" key={w} delay={i * 0.05} className="flex flex-col gap-2 bg-[var(--color-bg)] p-5 sm:p-6">
							<span className="text-[0.58rem] uppercase tracking-[0.26em] text-[var(--color-ink-dim)]">Window {String(i + 1).padStart(2, '0')}</span>
							<span className="tabular text-xl text-[var(--color-ink)] sm:text-2xl">
								{start}
								{end ? <span className="text-[var(--color-ink-dim)]"> – {end}</span> : null}
							</span>
						</Reveal>
					);
				})}
			</ul>
			{hours ? (
				<p className={clsx('mt-5 flex items-center gap-3 text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]')}>
					<span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
					Delivery &amp; collection: <span className="tabular normal-case tracking-normal text-[var(--color-ink)]">{hours}</span>
				</p>
			) : null}
		</div>
	);
}
