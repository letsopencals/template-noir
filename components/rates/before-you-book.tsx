import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { buttonClasses } from '@/components/ui/button';
import { siteConfig } from '@/lib/site-config';

/** Driver requirements as a numbered grid, plus what every rate includes. */
export function BeforeYouBook() {
	return (
		<section aria-labelledby="before-heading" className="border-t border-[var(--color-line)] bg-[var(--color-sand)]">
			<div className="mx-auto max-w-[1400px] px-6 py-[var(--spacing-section-sm)] lg:px-10 lg:py-[var(--spacing-section)]">
				<div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p className="eyebrow mb-4">Requirements</p>
						<h2 id="before-heading" className="heading-display text-[clamp(1.6rem,3.4vw,3rem)] text-[var(--color-ink)]">
							Before you book
						</h2>
					</div>
					<Link href="/how-it-works" className="link-underline self-start text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] lg:self-auto">
						How a rental works
					</Link>
				</div>

				<ol className="grid gap-px overflow-hidden border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-3">
					{siteConfig.requirements.map((r, i) => (
						<Reveal as="li" key={r.title} delay={(i % 3) * 0.06} className="flex flex-col gap-4 bg-[var(--color-bg)] p-7 lg:p-9">
							<span className="tabular text-sm text-[var(--color-primary)]">{String(i + 1).padStart(2, '0')}</span>
							<p className="text-lg text-[var(--color-ink)]">{r.title}</p>
							<p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">{r.body}</p>
						</Reveal>
					))}
					<Reveal as="li" delay={0.12} className="flex flex-col justify-between gap-8 bg-[var(--color-tint)] p-7 lg:p-9">
						<div>
							<p className="eyebrow mb-4 text-[var(--color-primary)]">Every rate includes</p>
							<ul className="flex flex-col gap-2">
								{siteConfig.included.map((item) => (
									<li key={item} className="flex gap-3 text-sm leading-relaxed text-[var(--color-ink)]">
										<span aria-hidden className="tabular text-[var(--color-primary)]">
											+
										</span>
										{item}
									</li>
								))}
							</ul>
						</div>
						<Link href={siteConfig.navCta.href} className={buttonClasses('primary', 'md', { className: 'self-start' })}>
							{siteConfig.navCta.label}
						</Link>
					</Reveal>
				</ol>
			</div>
		</section>
	);
}
