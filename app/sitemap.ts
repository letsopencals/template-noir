import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';
import { getFleet } from '@/lib/server-data';

const STATIC_PATHS: Array<[string, number]> = [
	['', 1],
	['/fleet', 0.9],
	['/book', 0.9],
	['/rates', 0.8],
	['/chauffeur', 0.8],
	['/delivery', 0.7],
	['/how-it-works', 0.7],
	['/journal', 0.6],
	['/about', 0.5],
	['/contact', 0.5],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const base = siteConfig.url;
	const now = new Date();

	const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map(([path, priority]) => ({
		url: `${base}${path}`,
		lastModified: now,
		changeFrequency: 'weekly',
		priority,
	}));

	const journalRoutes: MetadataRoute.Sitemap = siteConfig.routes.map((r) => ({
		url: `${base}/journal/${r.slug}`,
		lastModified: now,
		changeFrequency: 'monthly',
		priority: 0.5,
	}));

	const fleet = await getFleet();
	const carRoutes: MetadataRoute.Sitemap = fleet.map((car) => ({
		url: `${base}/fleet/${car.slug}`,
		lastModified: now,
		changeFrequency: 'weekly',
		priority: 0.8,
	}));

	return [...staticRoutes, ...carRoutes, ...journalRoutes];
}
