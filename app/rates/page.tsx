import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui/page-heading';
import { RatesExplorer } from '@/components/rates/rates-explorer';
import { ChauffeurRates, toChauffeurRates } from '@/components/rates/chauffeur-rates';
import { BeforeYouBook } from '@/components/rates/before-you-book';
import { toCarCard } from '@/components/fleet/fleet-data';
import { getCollection, getFleet, getStoreSettings } from '@/lib/server-data';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
	title: 'Rates',
	description: 'Daily rates, security deposits and included kilometres for every car in the NOIR Drive fleet, plus chauffeur rates. Delivery within Dubai is included.',
	alternates: { canonical: '/rates' },
};

export const revalidate = 300;

export default async function RatesPage() {
	const [fleet, chauffeur, settings] = await Promise.all([
		getFleet(),
		getCollection(siteConfig.collections.chauffeur),
		getStoreSettings(),
	]);
	const cars = fleet.map(toCarCard);
	const currency = settings?.currency ?? siteConfig.currency;

	return (
		<>
			<PageHeading
				eyebrow="Rates · per day, in AED"
				title={'One price\nper day.'}
				intro="The daily rate covers the car, comprehensive insurance and delivery anywhere in Dubai. The deposit is held at handover and never charged online."
			/>
			<section aria-label="Car rates" className="mx-auto max-w-[1400px] px-6 pb-[var(--spacing-section-sm)] lg:px-10 lg:pb-[var(--spacing-section)]">
				{cars.length > 0 ? (
					<RatesExplorer cars={cars} />
				) : (
					<p className="border-y border-[var(--color-line)] py-8 text-[var(--color-ink-muted)]">
						Rates are being updated. Message the concierge on WhatsApp at {siteConfig.contact.whatsapp}.
					</p>
				)}
				<p className="mt-8 max-w-2xl text-xs leading-relaxed text-[var(--color-ink-dim)]">
					Prices are per rental day, from pick-up to return. Extras such as a second driver or the excess waiver are added when you book. Fuel, Salik tolls and fines are settled at cost.
				</p>
			</section>
			<ChauffeurRates rates={toChauffeurRates(chauffeur?.products ?? [])} currency={currency} />
			<BeforeYouBook />
		</>
	);
}
