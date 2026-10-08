import type { Metadata } from 'next';
import Link from 'next/link';
import { fleetContent, siteConfig } from '@/lib/site-config';
import { buttonClasses } from '@/components/ui/button';
import { PageHeading } from '@/components/ui/page-heading';
import { ParallaxImage } from '@/components/motion/parallax-image';
import { Reveal } from '@/components/motion/reveal';
import { FactsStrip, type Fact } from '@/components/marketing/facts-strip';
import { PageSection } from '@/components/marketing/page-section';
import { CONTAINER } from '@/components/marketing/styles';
import { FinalCta } from '@/components/home/final-cta';

export const metadata: Metadata = {
	title: 'About',
	description: 'A small Dubai rental garage with a deliberately short list of cars.',
};

export default function Page() {
	const { about, categories, contact } = siteConfig;
	const cars = Object.values(fleetContent);
	const garageHours = contact.hours.find((h) => h.label === 'Garage')?.value ?? contact.hours[0]?.value ?? '';
	const deliveryHours = contact.hours.find((h) => h.label.startsWith('Delivery'))?.value ?? '';

	const facts: Fact[] = [
		{ label: 'Cars in the fleet', value: cars.length, note: 'All black' },
		{ label: 'Categories', value: categories.length, note: categories.map((c) => c.label).join(' · ') },
		{ label: 'Garage', value: garageHours, note: contact.addressShort },
		{ label: 'Delivery & collection', value: deliveryHours },
	];

	return (
		<>
			<PageHeading eyebrow={about.eyebrow} title={about.heading} />

			<div className="relative h-[70svh] min-h-[380px] w-full">
				<ParallaxImage src={about.image} alt={`The NOIR garage in ${contact.addressShort}`} strength={10} priority className="absolute inset-0" />
			</div>

			<section className={`${CONTAINER} grid gap-10 py-[var(--spacing-section-sm)] lg:grid-cols-12 lg:py-[var(--spacing-section)]`}>
				<Reveal className="lg:col-span-4">
					<p className="eyebrow">The garage</p>
				</Reveal>
				<div className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
					{about.body.map((p, i) => (
						<Reveal key={i} delay={i * 0.08}>
							<p className={i === 0 ? 'text-[clamp(1.25rem,2.2vw,1.75rem)] leading-[1.45] text-[var(--color-ink)]' : 'text-base leading-[1.8] text-[var(--color-ink-muted)] lg:text-lg'}>{p}</p>
						</Reveal>
					))}
				</div>
			</section>

			<div className={CONTAINER}>
				<FactsStrip facts={facts} />
			</div>

			<PageSection eyebrow="The fleet" title={'Three kinds\nof car.'} index="01" divider={false}>
				<ul className="grid gap-px bg-[var(--color-line)] sm:grid-cols-3">
					{categories.map((c) => {
						const count = cars.filter((car) => car.category === c.slug).length;
						return (
							<li key={c.slug} className="flex flex-col justify-between gap-10 bg-[var(--color-bg)] p-6 lg:p-8">
								<p className="heading-display text-xl text-[var(--color-ink)] lg:text-2xl">{c.label}</p>
								<p className="tabular text-sm text-[var(--color-ink-muted)]">
									{count} {count === 1 ? 'car' : 'cars'}
								</p>
							</li>
						);
					})}
				</ul>
				<div className="mt-10 flex flex-wrap gap-3">
					<Link href="/fleet" className={buttonClasses('outline', 'md')}>
						See the fleet
					</Link>
					<Link href="/contact" className={buttonClasses('ghost', 'md')}>
						Contact the concierge
					</Link>
				</div>
			</PageSection>

			<FinalCta />
		</>
	);
}
