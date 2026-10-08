import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { FleetCard } from '../fleet-card';
import type { CarCardData } from '../fleet-data';

/** Up to three other cars: same class first, then the closest daily rate. */
export function pickSimilar(car: CarCardData, fleet: CarCardData[], count = 3): CarCardData[] {
	return fleet
		.filter((c) => c.slug !== car.slug)
		.map((c) => ({ c, score: (c.category === car.category ? 0 : 1e9) + Math.abs(c.pricePerDay - car.pricePerDay) }))
		.sort((a, b) => a.score - b.score)
		.slice(0, count)
		.map((x) => x.c);
}

export function SimilarCars({ cars }: { cars: CarCardData[] }) {
	if (cars.length === 0) return null;
	return (
		<section aria-labelledby="similar-heading" className="border-t border-[var(--color-line)]">
			<div className="mx-auto max-w-[1400px] px-6 py-[var(--spacing-section-sm)] lg:px-10 lg:py-[var(--spacing-section)]">
				<div className="mb-10 flex items-end justify-between gap-6">
					<div>
						<p className="eyebrow mb-4">Also in the garage</p>
						<h2 id="similar-heading" className="heading-display text-[clamp(1.6rem,3.4vw,3rem)] text-[var(--color-ink)]">
							Similar cars
						</h2>
					</div>
					<Link href="/fleet" className="link-underline hidden text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] sm:inline-block">
						Whole fleet
					</Link>
				</div>
				<ul className="grid gap-5 md:grid-cols-3 lg:gap-6">
					{cars.map((c, i) => (
						<Reveal as="li" key={c.slug} delay={i * 0.08}>
							<FleetCard car={c} />
						</Reveal>
					))}
				</ul>
			</div>
		</section>
	);
}
