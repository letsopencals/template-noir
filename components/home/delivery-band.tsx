import Link from 'next/link';
import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { DubaiMap } from '@/components/marketing/dubai-map';
import { MapFrame } from '@/components/marketing/map-frame';
import { CONTAINER, SECTION_Y } from '@/components/marketing/styles';

/** Home §5: delivery copy + zone summary beside the animated Dubai route map. */
export function DeliveryBand() {
	const copy = siteConfig.marketing.deliveryBand;
	return (
		<section className={SECTION_Y}>
			<div className={clsx(CONTAINER, 'grid gap-14 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16')}>
				<div>
					<SectionHeading index="04" eyebrow={copy.eyebrow} title={copy.heading} />
					<Reveal delay={0.15}>
						<p className="mt-8 max-w-md leading-relaxed text-[var(--color-ink-muted)]">{copy.body}</p>
					</Reveal>
					<Reveal delay={0.25}>
						<dl className="mt-10 border-t border-[var(--color-line)]">
							{siteConfig.deliveryZones.map((zone) => (
								<div key={zone.key} className="flex items-baseline justify-between gap-6 border-b border-[var(--color-line)] py-4">
									<dt className="text-sm text-[var(--color-ink)]">{zone.name}</dt>
									<dd className="text-right text-[0.68rem] uppercase tracking-[0.2em] text-[var(--color-primary)]">{zone.fee}</dd>
								</div>
							))}
						</dl>
					</Reveal>
					<Reveal delay={0.35}>
						<Link href={copy.cta.href} className="link-underline mt-8 inline-block text-[0.7rem] font-medium uppercase tracking-[0.24em] text-[var(--color-primary)]">
							{copy.cta.label}
						</Link>
					</Reveal>
				</div>
				<MapFrame>
					<DubaiMap />
				</MapFrame>
			</div>
		</section>
	);
}
