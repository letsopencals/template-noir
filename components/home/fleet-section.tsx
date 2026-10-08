import Link from 'next/link';
import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { CONTAINER, SECTION_Y } from '@/components/marketing/styles';
import { FleetCarousel } from './fleet-carousel';
import type { HomeCar } from './types';

/** Home §2: section heading + the draggable fleet carousel. Hidden when there are no cars. */
export function FleetSection({ cars }: { cars: HomeCar[] }) {
	if (cars.length === 0) return null;
	const copy = siteConfig.marketing.fleetCarousel;
	return (
		<section className={clsx(SECTION_Y, 'overflow-hidden')}>
			<div className={clsx(CONTAINER, 'mb-12 flex flex-col gap-8 lg:mb-16 lg:flex-row lg:items-end lg:justify-between')}>
				<SectionHeading index="01" eyebrow={copy.eyebrow} title={copy.heading} />
				<Reveal delay={0.2}>
					<Link href={copy.cta.href} className="link-underline text-[0.7rem] font-medium uppercase tracking-[0.24em] text-[var(--color-primary)]">
						{copy.cta.label}
					</Link>
				</Reveal>
			</div>
			<FleetCarousel cars={cars} />
		</section>
	);
}
