import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { Marquee } from '@/components/motion/marquee';
import { CONTAINER } from '@/components/marketing/styles';

/** Home §9a: guest quotes on a slow marquee (pauses on hover; static with reduced motion). */
export function Testimonials() {
	return (
		<section aria-label="What guests say" className="border-y border-[var(--color-line)] bg-[var(--color-surface)] py-16 lg:py-24">
			<div className={clsx(CONTAINER, 'mb-10')}>
				<p className="eyebrow">{siteConfig.marketing.testimonialsEyebrow}</p>
			</div>
			<Marquee duration={70} gapClassName="gap-5 lg:gap-8">
				{siteConfig.testimonials.map((t) => (
					<figure
						key={t.name}
						className="flex w-[min(82vw,440px)] shrink-0 flex-col justify-between gap-10 border border-[var(--color-line)] bg-[var(--color-bg)] p-7 lg:p-9"
					>
						<blockquote className="text-lg leading-relaxed text-[var(--color-ink)] lg:text-xl">
							<span aria-hidden className="heading-display mr-1 text-[var(--color-primary)]">“</span>
							{t.quote}
						</blockquote>
						<figcaption className="flex items-center justify-between gap-4 border-t border-[var(--color-line)] pt-5">
							<span className="text-sm text-[var(--color-ink)]">{t.name}</span>
							<span className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">{t.context}</span>
						</figcaption>
					</figure>
				))}
			</Marquee>
		</section>
	);
}
