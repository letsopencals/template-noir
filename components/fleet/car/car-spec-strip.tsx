import { CountUp } from '@/components/motion/count-up';
import { Reveal } from '@/components/motion/reveal';
import type { CarContent } from '@/lib/site-config';

interface SpecItem {
	label: string;
	value: number;
	decimals?: number;
	unit: string;
}

/** The headline numbers, counted up as they scroll in. Renders nothing without editorial content. */
export function CarSpecStrip({ content }: { content: CarContent | null }) {
	if (!content) return null;
	const items: SpecItem[] = [
		{ label: 'Power', value: content.hp, unit: 'hp' },
		{ label: '0–100 km/h', value: content.zeroToHundred, decimals: 1, unit: 's' },
		{ label: 'Top speed', value: content.topSpeed, unit: 'km/h' },
		{ label: 'Seats', value: content.seats, unit: '' },
	];

	return (
		<section aria-label="Specifications" className="border-y border-[var(--color-line)]">
			<div className="mx-auto grid max-w-[1400px] grid-cols-2 lg:grid-cols-5">
				{items.map((item, i) => (
					<Reveal
						key={item.label}
						delay={i * 0.06}
						className="border-[var(--color-line)] px-6 py-8 odd:border-r max-lg:[&:nth-child(-n+2)]:border-b lg:border-r lg:px-10 lg:py-12"
					>
						<p className="eyebrow">{item.label}</p>
						<p className="mt-4 flex items-baseline gap-2 text-[var(--color-ink)]">
							<CountUp value={item.value} decimals={item.decimals ?? 0} className="text-[clamp(2rem,4vw,3.4rem)] leading-none" />
							{item.unit ? <span className="tabular text-sm text-[var(--color-ink-muted)]">{item.unit}</span> : null}
						</p>
					</Reveal>
				))}
				<Reveal delay={0.24} className="col-span-2 px-6 py-8 lg:col-span-1 lg:px-10 lg:py-12">
					<p className="eyebrow">Engine</p>
					<p className="mt-4 text-lg leading-snug text-[var(--color-ink)]">{content.engine}</p>
				</Reveal>
			</div>
		</section>
	);
}
