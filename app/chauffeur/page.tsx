import type { Metadata } from 'next';
import Link from 'next/link';
import type { ProductListItemResponse } from '@opencals/storefront-sdk';
import { getCollection, getProducts, getStoreSettings } from '@/lib/server-data';
import { siteConfig } from '@/lib/site-config';
import { getListItemGallery } from '@/lib/format';
import { Reveal } from '@/components/motion/reveal';
import { ParallaxImage } from '@/components/motion/parallax-image';
import { buttonClasses } from '@/components/ui/button';
import { PackageCard, type ChauffeurPackage } from '@/components/booking/chauffeur/package-card';

export const metadata: Metadata = {
	title: 'Chauffeur',
	description: 'Airport transfers, hourly hire, an evening in Dubai or a day in Abu Dhabi, with a NOIR chauffeur in one of our own cars.',
	alternates: { canonical: '/chauffeur' },
};

function plain(text: string | null | undefined): string {
	return (text ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toPackage(p: ProductListItemResponse, currency: string): ChauffeurPackage | null {
	const v = p.variants?.[0];
	if (!v) return null;
	return {
		slug: p.slug,
		title: p.title ?? 'Chauffeur',
		description: plain(p.description),
		price: v.price ?? p.price,
		currency,
		duration: v.duration ?? p.duration,
		custom: !!v.allowCustomDuration,
		maxDuration: v.maxDuration > 0 ? v.maxDuration : 0,
		image: getListItemGallery(p)[0] ?? null,
	};
}

export default async function ChauffeurPage() {
	const [collection, products, settings] = await Promise.all([
		getCollection(siteConfig.collections.chauffeur),
		getProducts(),
		getStoreSettings(),
	]);
	const currency = settings?.currency ?? siteConfig.currency;
	const ids = new Set((collection?.products ?? []).flatMap((p) => [p.id, p.productId]));
	const packages = products
		.filter((p) => ids.has(p.id) || p.variants?.some((v) => ids.has(v.id)))
		.map((p) => toPackage(p, currency))
		.filter((p): p is ChauffeurPackage => p !== null)
		.sort((a, b) => a.price - b.price);
	const c = siteConfig.chauffeur;

	return (
		<>
			<section className="relative overflow-hidden pt-32 pb-16 lg:pt-44 lg:pb-24">
				<div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-[1.05fr_1fr] lg:items-end lg:px-10">
					<div>
						<Reveal>
							<p className="eyebrow">{c.eyebrow}</p>
						</Reveal>
						<Reveal delay={0.08}>
							<h1 className="heading-display mt-6 text-5xl leading-[0.95] text-[var(--color-ink)] sm:text-6xl lg:text-7xl">{c.heading}</h1>
						</Reveal>
						<Reveal delay={0.16}>
							<p className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--color-ink-muted)]">{c.body}</p>
						</Reveal>
						<Reveal delay={0.24}>
							<ul className="mt-10 space-y-3 border-t border-[var(--color-line)] pt-8">
								{c.points.map((point, i) => (
									<li key={point} className="flex gap-4 text-sm text-[var(--color-ink-muted)]">
										<span className="tabular text-[var(--color-primary)]">{String(i + 1).padStart(2, '0')}</span>
										{point}
									</li>
								))}
							</ul>
						</Reveal>
					</div>
					<ParallaxImage src={c.image} alt="A NOIR chauffeur car under a hotel porte-cochère at night" className="aspect-[4/5] lg:aspect-[5/6]" priority sizes="(min-width: 1024px) 45vw, 100vw" />
				</div>
			</section>

			<section className="border-t border-[var(--color-line)] py-16 lg:py-24">
				<div className="mx-auto max-w-[1400px] px-6 lg:px-10">
					<div className="flex flex-wrap items-end justify-between gap-6">
						<div>
							<p className="eyebrow">Packages</p>
							<h2 className="heading-display mt-4 text-3xl text-[var(--color-ink)] sm:text-4xl">Choose the journey</h2>
						</div>
						<p className="max-w-sm text-sm text-[var(--color-ink-dim)]">Choose a package, then pick the day, the time and your chauffeur on the next step.</p>
					</div>

					{packages.length > 0 ? (
						<ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{packages.map((pkg, i) => (
								<Reveal key={pkg.slug} as="li" delay={i * 0.06}>
									<PackageCard pkg={pkg} index={i} />
								</Reveal>
							))}
						</ul>
					) : (
						<div className="mt-12 border border-dashed border-[var(--color-line-strong)] px-6 py-14 text-center">
							<p className="text-[var(--color-ink-muted)]">Chauffeur packages are not online right now.</p>
							<a href={siteConfig.contact.whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClasses('primary', 'md', { className: 'mt-6' })}>
								Book on WhatsApp
							</a>
						</div>
					)}

					<p className="mt-10 max-w-2xl text-xs leading-relaxed text-[var(--color-ink-dim)]">{c.note}</p>
				</div>
			</section>

			<section className="border-t border-[var(--color-line)] py-16">
				<div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-6 px-6 lg:px-10">
					<p className="heading-display text-xl text-[var(--color-ink)] sm:text-2xl">Rather drive yourself?</p>
					<Link href="/fleet" className={buttonClasses('outline', 'md')}>
						See the fleet
					</Link>
				</div>
			</section>
		</>
	);
}
