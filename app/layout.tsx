import type { Metadata, Viewport } from 'next';
import { Archivo, Inter_Tight, Geist_Mono } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Providers } from '@/components/providers';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { ScrollProgress } from '@/components/motion/scroll-progress';
import { siteConfig } from '@/lib/site-config';
import { getStoreSettings, storeImages } from '@/lib/server-data';
import './globals.css';

// Archivo is variable on weight AND width; `axes: ['wdth']` ships the width
// axis so `.heading-display` can use font-stretch: 125% (expanded).
const archivo = Archivo({
	subsets: ['latin'],
	axes: ['wdth'],
	variable: '--font-archivo',
	display: 'swap',
});
const interTight = Inter_Tight({
	subsets: ['latin'],
	variable: '--font-inter-tight',
	display: 'swap',
});
const geistMono = Geist_Mono({
	subsets: ['latin'],
	variable: '--font-geist-mono',
	display: 'swap',
});

const title = `${siteConfig.name} | ${siteConfig.tagline}`;

export const metadata: Metadata = {
	title: {
		default: title,
		template: `%s | ${siteConfig.name}`,
	},
	description: siteConfig.description,
	metadataBase: new URL(siteConfig.url),
	applicationName: siteConfig.name,
	keywords: ['luxury car rental Dubai', 'supercar rental Dubai', 'Rolls-Royce rental Dubai', 'Lamborghini rental Dubai', 'chauffeur Dubai'],
	openGraph: {
		title,
		description: siteConfig.description,
		siteName: siteConfig.name,
		locale: siteConfig.locale,
		type: 'website',
		images: [{ url: '/images/lifestyle/og.jpg', width: 1200, height: 630, alt: siteConfig.name }],
	},
	twitter: {
		card: 'summary_large_image',
		title,
		description: siteConfig.description,
		images: ['/images/lifestyle/og.jpg'],
	},
	robots: {
		index: true,
		follow: true,
	},
};

export const viewport: Viewport = {
	themeColor: '#050505',
	colorScheme: 'dark',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const initialSettings = await getStoreSettings();
	const { logo, banner } = storeImages(initialSettings);
	const [street, locality] = siteConfig.contact.address.split('\n');

	return (
		<html lang="en" className={`${archivo.variable} ${interTight.variable} ${geistMono.variable}`}>
			<body>
				{/* Allow parent frames to control scrolling via postMessage */}
				<script
					dangerouslySetInnerHTML={{
						__html: `window.addEventListener("message",function(e){if(e.data&&e.data.type==="scrollTo"&&e.data.id){var el=document.getElementById(e.data.id);if(el){var top=el.getBoundingClientRect().top+window.scrollY;window.scrollTo({top:top,behavior:"smooth"})}}if(e.data&&e.data.type==="scrollTop"){window.scrollTo({top:0,behavior:"smooth"})}});`,
					}}
				/>
				<Providers initialSettings={initialSettings}>
					<SmoothScroll>
						<ScrollProgress />
						<Header />
						<main>{children}</main>
						<Footer />
					</SmoothScroll>
				</Providers>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							'@context': 'https://schema.org',
							'@type': 'AutoRental',
							name: siteConfig.name,
							description: siteConfig.description,
							url: siteConfig.url,
							...(logo ? { logo } : {}),
							...(banner ? { image: banner } : {}),
							telephone: siteConfig.contact.phone,
							email: siteConfig.contact.email,
							currenciesAccepted: siteConfig.currency,
							priceRange: '$$$$',
							address: {
								'@type': 'PostalAddress',
								streetAddress: street,
								addressLocality: locality?.trim(),
								addressRegion: 'Dubai',
								addressCountry: siteConfig.country,
							},
							areaServed: ['Dubai', 'Abu Dhabi', 'Sharjah'],
							openingHoursSpecification: {
								'@type': 'OpeningHoursSpecification',
								dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
								opens: '08:00',
								closes: '22:00',
							},
						}),
					}}
				/>
			</body>
		</html>
	);
}
