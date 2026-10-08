import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCar, getFleet } from '@/lib/server-data';
import { siteConfig } from '@/lib/site-config';
import { formatMoney, toCarCard } from '@/components/fleet/fleet-data';
import { CarHero } from '@/components/fleet/car/car-hero';
import { CarSpecStrip } from '@/components/fleet/car/car-spec-strip';
import { CarGallery } from '@/components/fleet/car/car-gallery';
import { CarTerms } from '@/components/fleet/car/car-terms';
import { CarBooking, CarBookingFromParams } from '@/components/fleet/car/car-booking';
import { SimilarCars, pickSimilar } from '@/components/fleet/car/similar-cars';
import { CarJsonLd } from '@/components/fleet/car/car-json-ld';

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
	const fleet = await getFleet();
	return fleet.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { slug } = await params;
	const car = await getCar(slug);
	if (!car) return { title: 'Car not found' };
	const price = formatMoney(car.pricePerDay, car.currency);
	const description = car.content
		? `Rent the ${car.title} in Dubai from ${price} a day. ${car.content.tagline} ${car.content.kmPerDay} km a day, insurance and delivery included.`
		: `Rent the ${car.title} in Dubai from ${price} a day, delivered to your door.`;
	return {
		title: `${car.title} rental in Dubai`,
		description,
		alternates: { canonical: `/fleet/${car.slug}` },
		openGraph: {
			title: `${car.title} | ${siteConfig.name}`,
			description,
			images: [{ url: car.images.side, alt: car.title }],
		},
	};
}

export default async function CarPage({ params }: Params) {
	const { slug } = await params;
	const [found, fleet] = await Promise.all([getCar(slug), getFleet()]);
	if (!found) notFound();

	const car = toCarCard(found);
	const similar = pickSimilar(car, fleet.map(toCarCard));
	const terms = <CarTerms content={car.content} currency={car.currency} />;
	// Store descriptions can carry rich-text markup; the intro is plain text.
	const intro = car.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

	return (
		<>
			<CarJsonLd car={car} />
			<CarHero car={car} />
			<CarSpecStrip content={car.content} />
			{intro ? (
				<div className="mx-auto max-w-[1400px] px-6 pt-[var(--spacing-section-sm)] lg:px-10">
					<p className="max-w-3xl text-[clamp(1.15rem,1.8vw,1.5rem)] leading-relaxed text-[var(--color-ink)]">{intro}</p>
				</div>
			) : null}
			<CarGallery title={car.title} images={car.images} />
			<Suspense fallback={<CarBooking car={car}>{terms}</CarBooking>}>
				<CarBookingFromParams car={car}>{terms}</CarBookingFromParams>
			</Suspense>
			<SimilarCars cars={similar} />
			<nav aria-label="Breadcrumb" className="mx-auto max-w-[1400px] px-6 pb-16 lg:px-10">
				<ol className="flex gap-3 text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">
					<li>
						<Link href="/fleet" className="hover:text-[var(--color-ink)]">
							Fleet
						</Link>
					</li>
					<li aria-hidden>/</li>
					<li aria-current="page" className="text-[var(--color-ink-muted)]">
						{car.title}
					</li>
				</ol>
			</nav>
		</>
	);
}
