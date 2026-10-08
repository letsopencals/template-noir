'use client';

import { clsx } from 'clsx';
import type { ProductListVariantLocation } from '@opencals/storefront-sdk';
import { siteConfig } from '@/lib/site-config';

interface LocationSelectorProps {
	locations: ProductListVariantLocation[];
	selected: string | null;
	onSelect: (locationId: string) => void;
}

/** "Pick me up" (delivery) vs "From the garage" (physical); other types use their title. */
function labelFor(loc: ProductListVariantLocation): { title: string; hint: string } {
	if (loc.type === siteConfig.locationTypes.delivery) return { title: 'Pick me up', hint: 'Hotel, villa or airport' };
	if (loc.type === siteConfig.locationTypes.garage) return { title: 'From the garage', hint: loc.city ?? siteConfig.contact.addressShort };
	return { title: loc.title ?? 'Location', hint: loc.city ?? '' };
}

export function LocationSelector({ locations, selected, onSelect }: LocationSelectorProps) {
	if (locations.length === 0) return null;

	if (locations.length === 1) {
		const { title, hint } = labelFor(locations[0]!);
		return (
			<p className="inline-flex items-baseline gap-2 border border-[var(--color-line-strong)] px-4 py-2.5 text-sm text-[var(--color-ink)]">
				{title}
				{hint ? <span className="text-xs text-[var(--color-ink-dim)]">· {hint}</span> : null}
			</p>
		);
	}

	return (
		<div role="radiogroup" aria-label="Pick-up" className="grid gap-2 sm:grid-cols-2">
			{locations.map((loc) => {
				const isActive = loc.id === selected;
				const { title, hint } = labelFor(loc);
				return (
					<button
						key={loc.id}
						type="button"
						role="radio"
						aria-checked={isActive}
						onClick={() => onSelect(loc.id)}
						className={clsx(
							'border px-4 py-3.5 text-left transition-colors duration-300',
							isActive
								? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-black'
								: 'border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary-dark)]',
						)}
					>
						<span className="block text-sm">{title}</span>
						{hint ? <span className={clsx('mt-0.5 block text-[0.68rem]', isActive ? 'text-black/65' : 'text-[var(--color-ink-dim)]')}>{hint}</span> : null}
					</button>
				);
			})}
		</div>
	);
}
