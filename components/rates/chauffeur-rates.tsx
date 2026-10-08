import Link from 'next/link';
import type { ProductCollectionProduct } from '@opencals/storefront-sdk';
import { Reveal } from '@/components/motion/reveal';
import { buttonClasses } from '@/components/ui/button';
import { formatDuration } from '@/lib/format';
import { siteConfig } from '@/lib/site-config';
import { formatMoney } from '@/components/fleet/fleet-data';

export interface ChauffeurRate {
	slug: string;
	title: string;
	price: number;
	/** e.g. "per 1h" for hourly hire, "3h" for a fixed package. */
	unit: string;
}

/** Maps chauffeur-collection products to display rows (active only, cheapest first). */
export function toChauffeurRates(products: ProductCollectionProduct[]): ChauffeurRate[] {
	return products
		.filter((p) => p.status !== 'inactive')
		.map((p) => ({
			slug: p.slug,
			title: p.title,
			price: p.price,
			unit: p.allowCustomDuration ? `per ${formatDuration(p.duration)}` : formatDuration(p.duration),
		}))
		.sort((a, b) => a.price - b.price);
}

/** Dotted-leader price list for chauffeur packages, each linking to its booking flow. */
export function ChauffeurRates({ rates, currency }: { rates: ChauffeurRate[]; currency: string }) {
	return (
		<section aria-labelledby="chauffeur-rates-heading" className="border-t border-[var(--color-line)]">
			<div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-[var(--spacing-section-sm)] lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-[var(--spacing-section)]">
				<div className="lg:col-span-4">
					<p className="eyebrow mb-4">{siteConfig.chauffeur.eyebrow}</p>
					<h2 id="chauffeur-rates-heading" className="heading-display text-[clamp(1.6rem,3.4vw,3rem)] text-[var(--color-ink)]">
						Chauffeur rates
					</h2>
					<p className="mt-6 max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)]">{siteConfig.chauffeur.body}</p>
					<p className="mt-4 max-w-sm text-xs leading-relaxed text-[var(--color-ink-dim)]">{siteConfig.chauffeur.note}</p>
				</div>
				<div className="lg:col-span-8">
					{rates.length > 0 ? (
						<ul className="flex flex-col">
							{rates.map((r, i) => (
								<Reveal as="li" key={r.slug} delay={i * 0.05}>
									<Link
										href={`/booking/${r.slug}`}
										className="group/rate flex items-baseline border-b border-[var(--color-line)] py-6 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
									>
										<span className="min-w-0">
											<span className="heading-display block text-base text-[var(--color-ink)] transition-colors group-hover/rate:text-[var(--color-primary-bright)] sm:text-lg">
												{r.title}
											</span>
											<span className="tabular mt-1 block text-xs text-[var(--color-ink-dim)]">{r.unit}</span>
										</span>
										<span aria-hidden className="leader-line hidden sm:block" />
										<span className="ml-auto flex shrink-0 items-baseline gap-4 pl-4 sm:ml-0">
											<span className="tabular text-[var(--color-ink)]">{formatMoney(r.price, currency)}</span>
											<span
												aria-hidden
												className="text-[var(--color-ink-dim)] transition-[transform,color] duration-500 group-hover/rate:translate-x-1 group-hover/rate:text-[var(--color-primary)]"
											>
												→
											</span>
										</span>
									</Link>
								</Reveal>
							))}
						</ul>
					) : (
						<p className="border-y border-[var(--color-line)] py-8 text-[var(--color-ink-muted)]">
							Chauffeur packages are quoted on request. Message the concierge on WhatsApp at {siteConfig.contact.whatsapp}.
						</p>
					)}
					<div className="mt-10">
						<Link href="/chauffeur" className={buttonClasses('outline', 'md')}>
							About chauffeur service
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
