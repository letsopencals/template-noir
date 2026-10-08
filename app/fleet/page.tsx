import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { FleetBrowser, type FleetCategoryOption } from '@/components/fleet/fleet-browser';
import { FleetCard } from '@/components/fleet/fleet-card';
import { toCarCard, type CarCardData } from '@/components/fleet/fleet-data';
import { getCollections, getFleet } from '@/lib/server-data';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
	title: 'Fleet',
	description: 'Supercars, SUVs and grand tourers in Dubai, all black and all bookable by the day. Filter by class and check which cars are free for your dates.',
	alternates: { canonical: '/fleet' },
};

export const revalidate = 300;

export default async function FleetPage() {
	const [fleet, collections] = await Promise.all([getFleet(), getCollections()]);
	const cars = fleet.map(toCarCard);

	// Category chips come from the store's collections (minus chauffeur), in
	// site-config order, and only when they actually contain cars.
	const counts = new Map<string, number>();
	for (const car of cars) if (car.category) counts.set(car.category, (counts.get(car.category) ?? 0) + 1);
	const collectionSlugs = new Set(collections.filter((c) => c.slug !== siteConfig.collections.chauffeur).map((c) => c.slug));
	const categories: FleetCategoryOption[] = siteConfig.categories
		.filter((c) => (collectionSlugs.size === 0 || collectionSlugs.has(c.slug)) && (counts.get(c.slug) ?? 0) > 0)
		.map((c) => ({ slug: c.slug, label: c.label, count: counts.get(c.slug) ?? 0 }));

	return (
		<>
			<PageHeading
				eyebrow={`Fleet · ${cars.length || 'Twelve'} cars`}
				title={'The fleet,\nall in black.'}
				intro="Supercars, SUVs and grand tourers, booked by the day and delivered anywhere in Dubai. Add your dates to see what is free."
			/>
			{cars.length === 0 ? (
				<p className="mx-auto max-w-[1400px] px-6 pb-[var(--spacing-section-sm)] text-[var(--color-ink-muted)] lg:px-10">
					The fleet is being prepared. Message the concierge on WhatsApp at {siteConfig.contact.whatsapp}.
				</p>
			) : (
				<Suspense fallback={<StaticGrid cars={cars} />}>
					<FleetBrowser cars={cars} categories={categories} />
				</Suspense>
			)}
		</>
	);
}

/** Server-rendered grid shown until the URL-aware browser hydrates (and for crawlers). */
function StaticGrid({ cars }: { cars: CarCardData[] }) {
	return (
		<div className="mx-auto max-w-[1400px] px-6 pb-[var(--spacing-section-sm)] lg:px-10">
			<div className="mb-10 h-[86px] border-y border-[var(--color-line)]" />
			<ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12 lg:gap-6">
				{cars.map((car, i) => {
					const pattern = i % 4;
					const large = pattern === 0 || pattern === 3;
					return (
						<li key={car.slug} className={large ? 'lg:col-span-7' : 'lg:col-span-5'}>
							<FleetCard car={car} size={large ? 'large' : 'small'} index={i} priority={i < 2} />
						</li>
					);
				})}
			</ul>
		</div>
	);
}
