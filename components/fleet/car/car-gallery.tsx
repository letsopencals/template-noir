'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { clsx } from 'clsx';
import { RevealImage } from '@/components/motion/reveal';
import { SafeImage } from '@/components/ui/safe-image';
import type { CarImages } from '@/lib/site-config';
import type { LightboxImage } from './car-lightbox';

const CarLightbox = dynamic(() => import('./car-lightbox').then((m) => m.CarLightbox), { ssr: false });

const SLOTS: ReadonlyArray<{ key: keyof CarImages; label: string; frame: string; from: 'up' | 'left' | 'right' }> = [
	{ key: 'front', label: 'Front three-quarter', frame: 'aspect-[16/10] lg:col-span-8 lg:row-span-2 lg:aspect-auto', from: 'up' },
	{ key: 'interior', label: 'Cabin', frame: 'aspect-[4/3] lg:col-span-4', from: 'right' },
	{ key: 'wheel', label: 'Detail', frame: 'aspect-[4/3] lg:col-span-4', from: 'right' },
];

/**
 * Asymmetric detail gallery (front, cabin, wheel). Each tile opens the
 * lightbox (loaded on demand). Hidden when the car has no distinct detail
 * images — e.g. a store product without editorial content, where every angle
 * falls back to the same product photo.
 */
export function CarGallery({ title, images }: { title: string; images: CarImages }) {
	const [index, setIndex] = useState<number | null>(null);

	const items = useMemo<LightboxImage[]>(
		() => SLOTS.map((s) => ({ src: images[s.key], alt: `${title}, ${s.label.toLowerCase()}`, label: s.label })),
		[images, title],
	);
	const distinct = new Set(items.map((i) => i.src)).size;
	if (distinct < 2) return null;

	return (
		<section aria-labelledby="gallery-heading" className="mx-auto max-w-[1400px] px-6 py-[var(--spacing-section-sm)] lg:px-10 lg:py-[var(--spacing-section)]">
			<div className="mb-10 flex items-end justify-between gap-6">
				<h2 id="gallery-heading" className="heading-display text-[clamp(1.6rem,3.4vw,3rem)] text-[var(--color-ink)]">
					In detail
				</h2>
				<p className="eyebrow hidden sm:block">Select to enlarge</p>
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 lg:gap-5">
				{SLOTS.map((slot, i) => (
					<button
						key={slot.key}
						type="button"
						onClick={() => setIndex(i)}
						aria-label={`Enlarge: ${items[i]!.alt}`}
						className={clsx(
							'group/tile relative block overflow-hidden text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
							i === 0 && 'sm:col-span-2',
							slot.frame,
						)}
					>
						<span className="absolute inset-0 block">
							<RevealImage from={slot.from} delay={i * 0.08} className="image-placeholder h-full w-full">
								<SafeImage
									src={items[i]!.src}
									alt=""
									fill
									sizes={i === 0 ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, 50vw'}
									className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/tile:scale-[1.05] motion-reduce:transition-none"
								/>
							</RevealImage>
						</span>
						<span className="absolute bottom-0 left-0 flex items-center gap-3 p-4 text-[0.64rem] uppercase tracking-[0.24em] text-[var(--color-ink)]">
							<span className="tabular text-[var(--color-primary)]">{String(i + 1).padStart(2, '0')}</span>
							{slot.label}
						</span>
						<span aria-hidden className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-500 group-hover/tile:border-[var(--color-line-strong)]" />
					</button>
				))}
			</div>
			<CarLightbox images={items} index={index} onIndexChange={setIndex} />
		</section>
	);
}
