import Link from 'next/link';
import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { buttonClasses } from '@/components/ui/button';
import { ParallaxImage } from '@/components/motion/parallax-image';
import { Reveal, RevealText } from '@/components/motion/reveal';
import { MagneticButton } from '@/components/motion/magnetic-button';
import { CONTAINER } from '@/components/marketing/styles';

/** Closing call to action over a night-drive photograph. Reused on the marketing pages. */
export function FinalCta({ className }: { className?: string }) {
	const copy = siteConfig.marketing.finalCta;
	const { navCta, contact } = siteConfig;
	return (
		<section className={clsx('relative', className)}>
			<ParallaxImage src={copy.image} alt="" strength={14} className="min-h-[80svh] w-full" imageClassName="opacity-50">
				<div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,#050505_0%,rgba(5,5,5,0.35)_45%,rgba(5,5,5,0.85)_100%)]" />
				<div className={clsx(CONTAINER, 'relative z-10 flex min-h-[80svh] flex-col items-start justify-end py-20 lg:py-28')}>
					<p className="eyebrow mb-6">{copy.eyebrow}</p>
					<RevealText
						as="h2"
						text={copy.heading}
						className="heading-display text-[clamp(2.8rem,9vw,9rem)] text-[var(--color-ink)]"
						lineClassName="pb-[0.04em]"
					/>
					<Reveal delay={0.25} className="mt-10 flex w-full flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
						<p className="max-w-sm text-[var(--color-ink-muted)]">{copy.body}</p>
						<div className="flex flex-wrap gap-3">
							<MagneticButton>
								<Link href={navCta.href} className={buttonClasses('primary', 'lg')}>
									{navCta.label}
								</Link>
							</MagneticButton>
							<a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClasses('outline', 'lg')}>
								WhatsApp
							</a>
						</div>
					</Reveal>
				</div>
			</ParallaxImage>
		</section>
	);
}
