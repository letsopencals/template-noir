import type { Metadata } from 'next';
import Link from 'next/link';
import { getFleet } from '@/lib/server-data';
import { siteConfig } from '@/lib/site-config';
import { buttonClasses } from '@/components/ui/button';
import { sanitizeRange, toBookCar } from '@/components/rental/book/book-car';
import { BookFlow } from '@/components/rental/book/book-flow';
import type { HandoverMode } from '@/hooks/use-rental-handover';

export const metadata: Metadata = {
	title: 'Book a car',
	description: 'Choose a car, your dates and where we should deliver it.',
	alternates: { canonical: '/book' },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string | null {
	return (Array.isArray(v) ? v[0] : v) ?? null;
}

export default async function BookPage({ searchParams }: { searchParams: SearchParams }) {
	const [params, fleet] = await Promise.all([searchParams, getFleet()]);
	const cars = fleet.map(toBookCar).filter((c) => c.variant && (c.garage || c.delivery));

	if (cars.length === 0) {
		return (
			<section className="mx-auto max-w-[1400px] px-6 pb-32 pt-40 lg:px-10 lg:pt-48">
				<p className="eyebrow mb-6">Booking</p>
				<h1 className="heading-display text-[clamp(2rem,5vw,4rem)] text-[var(--color-ink)]">No cars to book right now</h1>
				<p className="mt-6 max-w-lg text-[var(--color-ink-muted)]">Message the concierge and we will find you a car.</p>
				<Link href={siteConfig.contact.whatsappHref} className={buttonClasses('primary', 'md', { className: 'mt-8' })}>
					WhatsApp the concierge
				</Link>
			</section>
		);
	}

	const requested = one(params.car);
	const car = cars.find((c) => c.slug === requested) ?? cars[0]!;
	const range = sanitizeRange(one(params.from), one(params.until), siteConfig.timezone, car.maxDays);
	const mode: HandoverMode = one(params.mode) === 'garage' ? 'garage' : 'delivery';

	return (
		<section className="mx-auto max-w-[1400px] px-6 pt-32 lg:px-10 lg:pt-40">
			<p className="eyebrow mb-6">Book a car</p>
			<BookFlow cars={cars} initial={{ carSlug: car.slug, from: range.from, until: range.until, mode }} />
		</section>
	);
}
