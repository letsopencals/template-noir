import { siteConfig } from '@/lib/site-config';
import { getFleet, getStoreSettings, storeImages } from '@/lib/server-data';
import { Hero } from '@/components/home/hero';
import { FleetSection } from '@/components/home/fleet-section';
import { Spotlight } from '@/components/home/spotlight';
import { HowItWorksBand } from '@/components/home/how-it-works-band';
import { DeliveryBand } from '@/components/home/delivery-band';
import { ChauffeurTeaser } from '@/components/home/chauffeur-teaser';
import { DetailsGallery } from '@/components/home/details-gallery';
import { JournalTeaser } from '@/components/home/journal-teaser';
import { Testimonials } from '@/components/home/testimonials';
import { FaqSection } from '@/components/home/faq-section';
import { FinalCta } from '@/components/home/final-cta';
import { toHomeCar, toSpotlightCar } from '@/components/home/to-home-car';

export default async function HomePage() {
	const [fleet, settings] = await Promise.all([getFleet(), getStoreSettings()]);
	const cars = fleet.map(toHomeCar);
	const spotlight = toSpotlightCar(fleet);
	const spotlightCopy = siteConfig.marketing.spotlight;

	return (
		<>
			<Hero cars={cars} lead={cars[0] ?? null} cover={storeImages(settings).banner} />
			<FleetSection cars={cars} />
			{spotlight ? <Spotlight car={spotlight} eyebrow={spotlightCopy.eyebrow} ctaLabel={spotlightCopy.cta} /> : null}
			<HowItWorksBand />
			<DeliveryBand />
			<ChauffeurTeaser />
			<DetailsGallery />
			<JournalTeaser />
			<Testimonials />
			<FaqSection />
			<FinalCta />
		</>
	);
}
