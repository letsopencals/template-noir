import { siteConfig } from '@/lib/site-config';
import { makeName, type CarCardData } from '../fleet-data';

function absolute(url: string): string {
	return url.startsWith('http') ? url : `${siteConfig.url}${url}`;
}

/** schema.org Product + Offer (price per day) for a car page. */
export function CarJsonLd({ car }: { car: CarCardData }) {
	const data = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: car.title,
		description: car.content?.tagline ?? (car.description.replace(/<[^>]+>/g, ' ').trim() || siteConfig.description),
		image: [car.images.side, car.images.front, car.images.interior].map(absolute),
		url: `${siteConfig.url}/fleet/${car.slug}`,
		category: car.categoryLabel ?? 'Car rental',
		brand: { '@type': 'Brand', name: makeName(car.title) },
		...(car.content
			? {
					additionalProperty: [
						{ '@type': 'PropertyValue', name: 'Power', value: car.content.hp, unitText: 'hp' },
						{ '@type': 'PropertyValue', name: 'Seats', value: car.content.seats },
						{ '@type': 'PropertyValue', name: 'Engine', value: car.content.engine },
					],
				}
			: {}),
		offers: {
			'@type': 'Offer',
			url: `${siteConfig.url}/fleet/${car.slug}`,
			priceCurrency: car.currency,
			price: car.pricePerDay,
			priceSpecification: {
				'@type': 'UnitPriceSpecification',
				price: car.pricePerDay,
				priceCurrency: car.currency,
				unitCode: 'DAY',
				referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'DAY' },
			},
			availability: 'https://schema.org/InStock',
			businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
			seller: { '@type': 'AutoRental', name: siteConfig.name, url: siteConfig.url },
		},
	};
	return (
		<script
			type="application/ld+json"
			// JSON.stringify output with "<" escaped so it can't close the script tag.
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
		/>
	);
}
