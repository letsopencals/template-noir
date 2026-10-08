'use client';

import { memo, useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { Reveal } from '@/components/motion/reveal';
import { DubaiMap, MAP_DESTINATIONS, type MapZoneKey } from './dubai-map';
import { MapFrame } from './map-frame';

export interface DeliveryZone {
	key: string;
	name: string;
	areas: readonly string[];
	fee: string;
	note: string;
}

/**
 * Delivery zones beside the route map. Hovering or focusing a zone card
 * highlights its routes on the map (others dim); tapping toggles on touch.
 */
export function DeliveryZones({ zones, className }: { zones: readonly DeliveryZone[]; className?: string }) {
	const [highlight, setHighlight] = useState<MapZoneKey | null>(null);
	const clear = useCallback(() => setHighlight(null), []);

	return (
		<div className={clsx('grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-14', className)}>
			<ul className="space-y-3" onPointerLeave={clear}>
				{zones.map((zone, i) => (
					<ZoneCard key={zone.key} zone={zone} index={i} active={highlight === zone.key} onActivate={setHighlight} />
				))}
			</ul>
			<div className="lg:sticky lg:top-28 lg:self-start">
				<MapFrame caption="Routes from the Al Quoz garage · stylised, not to scale">
					<DubaiMap highlight={highlight} />
				</MapFrame>
			</div>
		</div>
	);
}

interface ZoneCardProps {
	zone: DeliveryZone;
	index: number;
	active: boolean;
	onActivate: (key: MapZoneKey | null) => void;
}

const ZoneCard = memo(function ZoneCard({ zone, index, active, onActivate }: ZoneCardProps) {
	const key = zone.key as MapZoneKey;
	const hasRoutes = MAP_DESTINATIONS.some((d) => d.zone === key);
	const activate = useCallback(() => onActivate(hasRoutes ? key : null), [onActivate, hasRoutes, key]);
	const toggle = useCallback(() => onActivate(active ? null : hasRoutes ? key : null), [onActivate, active, hasRoutes, key]);

	return (
		<Reveal as="li" delay={index * 0.08}>
			<button
				type="button"
				aria-pressed={active}
				onPointerEnter={activate}
				onFocus={activate}
				onClick={toggle}
				className={clsx(
					'w-full rounded-[2px] border p-6 text-left transition-colors duration-500 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--color-primary)] sm:p-7',
					active ? 'border-[var(--color-primary)] bg-[var(--color-tint)]' : 'border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-line-strong)]',
				)}
			>
				<span className="mb-5 flex items-baseline justify-between gap-4">
					<span className="heading-display text-xl text-[var(--color-ink)]">{zone.name}</span>
					<span className={clsx('text-right text-[0.62rem] uppercase tracking-[0.2em]', active ? 'text-[var(--color-primary-bright)]' : 'text-[var(--color-primary)]')}>{zone.fee}</span>
				</span>
				<span className="block text-sm leading-relaxed text-[var(--color-ink-muted)]">{zone.note}</span>
				<span className="mt-5 flex flex-wrap gap-1.5">
					{zone.areas.map((area) => (
						<span key={area} className="border border-[var(--color-line)] px-2 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
							{area}
						</span>
					))}
				</span>
			</button>
		</Reveal>
	);
});
