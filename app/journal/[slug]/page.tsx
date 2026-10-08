import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fleetContent, siteConfig } from '@/lib/site-config';
import { getCar } from '@/lib/server-data';
import { ParallaxImage } from '@/components/motion/parallax-image';
import { RevealText } from '@/components/motion/reveal';
import { RouteStats } from '@/components/marketing/route-stats';
import { RouteStory, type RouteStoryImage } from '@/components/marketing/route-story';
import { BestInCard } from '@/components/marketing/best-in-card';
import { NextRoute } from '@/components/marketing/next-route';
import { titleFromSlug } from '@/components/marketing/format';
import { CONTAINER } from '@/components/marketing/styles';
import { FinalCta } from '@/components/home/final-cta';

interface Props {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return siteConfig.routes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const route = siteConfig.routes.find((r) => r.slug === slug);
	if (!route) return { title: 'Journal' };
	return {
		title: `${route.title} · Journal`,
		description: route.intro,
		openGraph: { images: [route.image] },
	};
}

export default async function Page({ params }: Props) {
	const { slug } = await params;
	const index = siteConfig.routes.findIndex((r) => r.slug === slug);
	const route = siteConfig.routes[index];
	if (!route) notFound();
	const next = siteConfig.routes[(index + 1) % siteConfig.routes.length] ?? null;

	const content = fleetContent[route.bestIn] ?? null;
	const live = await getCar(route.bestIn);
	const carTitle = live?.title ?? titleFromSlug(route.bestIn);
	const carImages = live?.images ?? content?.images ?? null;

	const images: RouteStoryImage[] = carImages
		? [
				{ src: carImages.front, alt: `${carTitle} on the road`, layout: 'wide' },
				{ src: carImages.interior, alt: `${carTitle} cabin`, layout: 'pair' },
				{ src: carImages.wheel, alt: `${carTitle} wheel detail`, layout: 'pair' },
			]
		: [];

	return (
		<>
			<header className="relative h-[88svh] min-h-[520px] w-full overflow-hidden">
				<ParallaxImage src={route.image} alt={`${route.title}, ${route.region}`} strength={12} className="absolute inset-0" priority />
				<div aria-hidden className="scrim-bottom absolute inset-0" />
				<div className={`${CONTAINER} absolute inset-x-0 bottom-0 pb-12 lg:pb-16`}>
					<p className="eyebrow mb-5">Journal · {route.region}</p>
					<RevealText
						as="h1"
						text={route.title}
						trigger="mount"
						className="heading-display text-[clamp(2.6rem,8vw,7.5rem)] text-[var(--color-ink)]"
						lineClassName="pb-[0.05em]"
					/>
				</div>
			</header>

			<div className={CONTAINER}>
				<RouteStats
					distanceKm={route.distanceKm}
					duration={route.duration}
					bestTime={route.bestTime}
					bestIn={{ slug: route.bestIn, title: carTitle }}
				/>
			</div>

			<section className={`${CONTAINER} py-[var(--spacing-section-sm)] lg:py-[var(--spacing-section)]`}>
				<RouteStory intro={route.intro} body={route.body} images={images} />
			</section>

			{carImages ? (
				<section className={`${CONTAINER} pb-[var(--spacing-section-sm)] lg:pb-[var(--spacing-section)]`}>
					<BestInCard
						slug={live?.slug ?? route.bestIn}
						title={carTitle}
						tagline={content?.tagline ?? null}
						image={carImages.side}
						pricePerDay={live && Number.isFinite(live.pricePerDay) ? live.pricePerDay : null}
						currency={live?.currency ?? siteConfig.currency}
						routeTitle={route.title}
					/>
				</section>
			) : null}

			{next && next.slug !== route.slug ? <NextRoute slug={next.slug} title={next.title} region={next.region} image={next.image} /> : null}
			<FinalCta />
		</>
	);
}
