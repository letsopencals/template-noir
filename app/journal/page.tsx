import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import { getFleet } from '@/lib/server-data';
import { PageHeading } from '@/components/ui/page-heading';
import { JournalCard } from '@/components/marketing/journal-card';
import { titleFromSlug } from '@/components/marketing/format';
import { CONTAINER } from '@/components/marketing/styles';
import { FinalCta } from '@/components/home/final-cta';

export const metadata: Metadata = {
	title: 'Journal',
	description: 'Five drives from Dubai, and the car we would take on each.',
};

export default async function Page() {
	const fleet = await getFleet();
	const titles = new Map(fleet.map((c) => [c.slug, c.title]));

	return (
		<>
			<PageHeading eyebrow="Drives" title="Journal" intro="Five drives from Dubai, and the car we would take on each." />
			<div className={`${CONTAINER} flex flex-col gap-24 pb-[var(--spacing-section-sm)] lg:gap-36 lg:pb-[var(--spacing-section)]`}>
				{siteConfig.routes.map((route, i) => (
					<JournalCard
						key={route.slug}
						slug={route.slug}
						title={route.title}
						region={route.region}
						intro={route.intro}
						distanceKm={route.distanceKm}
						duration={route.duration}
						image={route.image}
						bestInTitle={titles.get(route.bestIn) ?? titleFromSlug(route.bestIn)}
						index={i}
						reverse={i % 2 === 1}
					/>
				))}
			</div>
			<FinalCta />
		</>
	);
}
