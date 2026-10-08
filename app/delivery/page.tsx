import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { PageHeading } from '@/components/ui/page-heading';
import { buttonClasses } from '@/components/ui/button';
import { PageSection } from '@/components/marketing/page-section';
import { DeliveryZones } from '@/components/marketing/delivery-zones';
import { SplitFeature } from '@/components/marketing/split-feature';
import { HandoverWindows } from '@/components/marketing/handover-windows';
import { FinalCta } from '@/components/home/final-cta';

export const metadata: Metadata = {
	title: 'Delivery',
	description: 'Delivery and collection anywhere in Dubai and at both airports.',
};

export default function Page() {
	const { deliveryZones, handoverTimes, contact, marketing } = siteConfig;
	const copy = marketing.delivery;
	const airport = deliveryZones.find((z) => z.key === 'airport');
	const deliveryHours = contact.hours.find((h) => h.label.toLowerCase().startsWith('delivery'))?.value;
	const garageHours = contact.hours.find((h) => h.label === 'Garage')?.value;

	return (
		<>
			<PageHeading eyebrow="Delivery" title={'Delivered\nto your door'} intro="Delivery and collection anywhere in Dubai and at both airports." />

			<PageSection index="01" eyebrow="Zones and fees" title={'Where we\ndeliver.'} intro={marketing.deliveryBand.body} divider={false}>
				<DeliveryZones zones={deliveryZones} />
			</PageSection>

			{airport ? (
				<SplitFeature index="02" eyebrow={copy.airport.eyebrow} title={copy.airport.heading} image={copy.airport.image} imageAlt="Meet-and-greet in arrivals" reverse>
					<p className="max-w-md leading-relaxed text-[var(--color-ink-muted)]">{airport.note}</p>
					<ul className="mt-8 border-t border-[var(--color-line)]">
						{airport.areas.map((a) => (
							<li key={a} className="flex items-center justify-between border-b border-[var(--color-line)] py-4 text-sm text-[var(--color-ink)]">
								{a}
								<span className="text-[0.62rem] uppercase tracking-[0.2em] text-[var(--color-primary)]">{airport.fee}</span>
							</li>
						))}
					</ul>
				</SplitFeature>
			) : null}

			<PageSection index="03" eyebrow={copy.handover.eyebrow} title={copy.handover.heading} intro={copy.handover.body}>
				<HandoverWindows windows={handoverTimes} hours={deliveryHours} />
			</PageSection>

			<SplitFeature index="04" eyebrow={copy.garage.eyebrow} title={copy.garage.heading} image={copy.garage.image} imageAlt="The NOIR garage in Al Quoz">
				<address className="whitespace-pre-line not-italic leading-relaxed text-[var(--color-ink)]">{contact.address}</address>
				{garageHours ? (
					<p className="mt-4 text-sm text-[var(--color-ink-muted)]">
						Garage open <span className="tabular text-[var(--color-ink)]">{garageHours}</span>
					</p>
				) : null}
				<div className="mt-8 flex flex-wrap gap-3">
					<Link href="/book?mode=garage" className={buttonClasses('primary', 'md')}>
						Book with collection
					</Link>
					<a href={contact.mapHref} target="_blank" rel="noopener noreferrer" className={buttonClasses('outline', 'md')}>
						Directions
					</a>
				</div>
			</SplitFeature>

			<FinalCta />
		</>
	);
}
