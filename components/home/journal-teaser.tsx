import Link from 'next/link';
import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { RoutesTeaser } from '@/components/marketing/routes-teaser';
import { CONTAINER, SECTION_Y } from '@/components/marketing/styles';

/** Home §8: the five drives, with hover-swapped photography → /journal/<slug>. */
export function JournalTeaser() {
	const copy = siteConfig.marketing.journalTeaser;
	const routes = siteConfig.routes.map(({ slug, title, region, distanceKm, duration, image }) => ({
		slug,
		title,
		region,
		distanceKm,
		duration,
		image,
	}));
	return (
		<section className={clsx(SECTION_Y, 'border-t border-[var(--color-line)]')}>
			<div className={CONTAINER}>
				<div className="mb-14 grid gap-8 lg:mb-16 lg:grid-cols-2 lg:items-end">
					<SectionHeading index="07" eyebrow={copy.eyebrow} title={copy.heading} />
					<Reveal delay={0.15} className="lg:ml-auto lg:max-w-md">
						<p className="leading-relaxed text-[var(--color-ink-muted)]">{copy.body}</p>
						<Link href={copy.cta.href} className="link-underline mt-6 inline-block text-[0.7rem] font-medium uppercase tracking-[0.24em] text-[var(--color-primary)]">
							{copy.cta.label}
						</Link>
					</Reveal>
				</div>
				<RoutesTeaser routes={routes} />
			</div>
		</section>
	);
}
