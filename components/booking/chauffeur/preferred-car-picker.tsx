'use client';

import { memo } from 'react';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { siteConfig } from '@/lib/site-config';

/** Minimal car card data passed from the RSC (no product payload, no staff). */
export interface PreferredCarOption {
	slug: string;
	title: string;
	image: string | null;
}

interface PreferredCarPickerProps {
	cars: PreferredCarOption[];
	value: string | null;
	onChange: (slug: string | null) => void;
}

const TILE = 'group relative flex w-[150px] shrink-0 flex-col border text-left transition-colors duration-300';

/**
 * Optional preferred car for a chauffeur booking. Stored as the appointment's
 * `preferred_car` custom attribute only: it does not reserve the car.
 */
export const PreferredCarPicker = memo(function PreferredCarPicker({ cars, value, onChange }: PreferredCarPickerProps) {
	if (cars.length === 0) return null;
	return (
		<div>
			<div className="flex items-baseline justify-between gap-4">
				<p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)]">Preferred car · optional</p>
				{value ? (
					<button type="button" onClick={() => onChange(null)} className="link-underline text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-primary)]">
						Clear
					</button>
				) : null}
			</div>
			<div data-lenis-prevent role="radiogroup" aria-label="Preferred car" className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2">
				<button
					type="button"
					role="radio"
					aria-checked={value === null}
					onClick={() => onChange(null)}
					className={clsx(TILE, value === null ? 'border-[var(--color-primary)]' : 'border-[var(--color-line-strong)] hover:border-[var(--color-primary-dark)]')}
				>
					<div className="flex aspect-[4/3] w-full items-center justify-center bg-[var(--color-surface)]">
						<span className="heading-display text-sm text-[var(--color-primary)]">Your call</span>
					</div>
					<p className="px-3 py-2.5 text-xs text-[var(--color-ink-muted)]">No preference</p>
				</button>
				{cars.map((car) => {
					const active = value === car.slug;
					return (
						<button
							key={car.slug}
							type="button"
							role="radio"
							aria-checked={active}
							onClick={() => onChange(car.slug)}
							className={clsx(TILE, active ? 'border-[var(--color-primary)]' : 'border-[var(--color-line-strong)] hover:border-[var(--color-primary-dark)]')}
						>
							<div className="image-placeholder relative aspect-[4/3] w-full overflow-hidden">
								<SafeImage src={car.image} alt={car.title} fill sizes="150px" className="object-cover transition duration-700 group-hover:scale-105" />
							</div>
							<p className={clsx('truncate px-3 py-2.5 text-xs', active ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink)]')}>{car.title}</p>
						</button>
					);
				})}
			</div>
			<p className="mt-3 text-xs leading-relaxed text-[var(--color-ink-dim)]">{siteConfig.chauffeur.note}</p>
		</div>
	);
});
