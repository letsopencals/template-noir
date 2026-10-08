'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { clsx } from 'clsx';
import { RevealImage } from '@/components/motion/reveal';
import { SafeImage } from '@/components/ui/safe-image';
import type { LightboxImage } from './car-lightbox';

const CarLightbox = dynamic(() => import('./car-lightbox').then((m) => m.CarLightbox), { ssr: false });

type Tile = { frame: string; from: 'up' | 'left' | 'right'; sizes: string };

const LEAD: Tile = { frame: 'aspect-[16/10] sm:col-span-2 lg:col-span-8 lg:row-span-2 lg:aspect-auto', from: 'up', sizes: '(min-width: 1024px) 66vw, 100vw' };
const SIDE: Tile = { frame: 'aspect-[4/3] lg:col-span-4', from: 'right', sizes: '(min-width: 1024px) 33vw, 50vw' };
const ROW: Tile = { frame: 'aspect-[4/3] lg:col-span-4', from: 'up', sizes: '(min-width: 1024px) 33vw, 50vw' };
const SOLO: Tile = { frame: 'aspect-[16/9] sm:col-span-2 lg:col-span-12', from: 'up', sizes: '100vw' };

/** One large tile with two beside it, then rows of three; a single photo spans the width. */
function tileFor(index: number, count: number): Tile {
	if (count === 1) return SOLO;
	if (index === 0) return LEAD;
	return index <= 2 ? SIDE : ROW;
}

/**
 * Asymmetric gallery of the car's extra product photos (every image after the
 * default one, as set in the dashboard). Each tile opens the lightbox (loaded
 * on demand). Hidden when the product has no extra photos.
 */
export function CarGallery({ title, images }: { title: string; images: string[] }) {
	const [index, setIndex] = useState<number | null>(null);

	const items = useMemo<LightboxImage[]>(
		() => images.map((src, i) => ({ src, alt: `${title}, photo ${i + 1} of ${images.length}`, label: title })),
		[images, title],
	);
	if (items.length === 0) return null;

	return (
		<section aria-labelledby="gallery-heading" className="mx-auto max-w-[1400px] px-6 py-[var(--spacing-section-sm)] lg:px-10 lg:py-[var(--spacing-section)]">
			<div className="mb-10 flex items-end justify-between gap-6">
				<h2 id="gallery-heading" className="heading-display text-[clamp(1.6rem,3.4vw,3rem)] text-[var(--color-ink)]">
					In detail
				</h2>
				<p className="eyebrow hidden sm:block">Select to enlarge</p>
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
				{items.map((item, i) => {
					const tile = tileFor(i, items.length);
					return (
						<button
							key={item.src}
							type="button"
							onClick={() => setIndex(i)}
							aria-label={`Enlarge: ${item.alt}`}
							className={clsx(
								'group/tile relative block overflow-hidden text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
								tile.frame,
							)}
						>
							<span className="absolute inset-0 block">
								<RevealImage from={tile.from} delay={Math.min(i, 4) * 0.08} className="image-placeholder h-full w-full">
									<SafeImage
										src={item.src}
										alt=""
										fill
										sizes={tile.sizes}
										className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/tile:scale-[1.05] motion-reduce:transition-none"
									/>
								</RevealImage>
							</span>
							<span className="tabular absolute bottom-0 left-0 p-4 text-[0.64rem] uppercase tracking-[0.24em] text-[var(--color-primary)]">
								{String(i + 1).padStart(2, '0')}
							</span>
							<span aria-hidden className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-500 group-hover/tile:border-[var(--color-line-strong)]" />
						</button>
					);
				})}
			</div>
			<CarLightbox images={items} index={index} onIndexChange={setIndex} />
		</section>
	);
}
