import Link from 'next/link';
import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { ParallaxImage } from '@/components/motion/parallax-image';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { CONTAINER } from '@/components/marketing/styles';

/** Home §4: the three steps over a full-bleed parallax photograph. */
export function HowItWorksBand() {
	const copy = siteConfig.marketing.howItWorks;
	return (
		<section className="relative">
			<ParallaxImage src={copy.image} alt="" strength={12} className="min-h-[100svh] w-full" imageClassName="opacity-60">
				<div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,#050505_0%,rgba(5,5,5,0.55)_30%,rgba(5,5,5,0.7)_70%,#050505_100%)]" />
				<div className={clsx(CONTAINER, 'relative z-10 flex min-h-[100svh] flex-col justify-between py-[var(--spacing-section-sm)] lg:py-[var(--spacing-section)]')}>
					<div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
						<SectionHeading index="03" eyebrow={copy.eyebrow} title={copy.heading} />
						<Reveal delay={0.2}>
							<Link href={copy.cta.href} className="link-underline text-[0.7rem] font-medium uppercase tracking-[0.24em] text-[var(--color-primary)]">
								{copy.cta.label}
							</Link>
						</Reveal>
					</div>

					<ol className="mt-20 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-14">
						{siteConfig.howItWorks.map((step, i) => (
							<Reveal as="li" key={step.index} delay={0.15 * i} className="relative pt-8">
								<span aria-hidden className="absolute inset-x-0 top-0 h-px bg-[var(--color-line-strong)]" />
								<span aria-hidden className="absolute left-0 top-0 h-px w-12 bg-[var(--color-primary)]" />
								<p className="tabular mb-6 text-sm text-[var(--color-primary)]">{step.index}</p>
								<h3 className="heading-display mb-4 text-2xl text-[var(--color-ink)] lg:text-3xl">{step.title}</h3>
								<p className="max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)] lg:text-base">{step.body}</p>
							</Reveal>
						))}
					</ol>
				</div>
			</ParallaxImage>
		</section>
	);
}
