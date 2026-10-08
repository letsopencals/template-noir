import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { siteConfig, type CarContent } from '@/lib/site-config';
import { formatMoney } from '../fleet-data';

/**
 * "Included" plus deposit and driver requirements for one car. Server
 * Component; rendered in the left column beside the sticky booking card.
 * Falls back to the general terms when the car has no editorial content.
 */
export function CarTerms({ content, currency }: { content: CarContent | null; currency: string }) {
	const highlights = [
		{
			label: 'Kilometres',
			value: content ? `${content.kmPerDay} km / day` : 'Daily allowance',
			body: 'Included for every rental day. Add the +250 km pack when you book, or pay per extra km at return.',
		},
		{
			label: 'Insurance',
			value: 'Comprehensive',
			body: 'Every rental is covered with a set excess. The excess waiver extra takes it to zero.',
		},
		{
			label: 'Delivery',
			value: 'Anywhere in Dubai',
			body: 'Hotel, villa or either airport, and collection at the end. Abu Dhabi and Sharjah are a fixed-fee extra.',
		},
	];
	// The first requirement (age) is replaced by this car's own minimum.
	const requirements = siteConfig.requirements.filter((r) => !r.title.startsWith('Security deposit'));

	return (
		<div className="flex flex-col gap-[var(--spacing-section-sm)]">
			<section aria-labelledby="included-heading">
				<p className="eyebrow mb-4">Included</p>
				<h2 id="included-heading" className="heading-display mb-10 text-[clamp(1.5rem,3vw,2.6rem)] text-[var(--color-ink)]">
					In the daily rate
				</h2>
				<div className="grid gap-px overflow-hidden border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-3">
					{highlights.map((h, i) => (
						<Reveal key={h.label} delay={i * 0.06} className="bg-[var(--color-bg)] p-6">
							<p className="eyebrow">{h.label}</p>
							<p className="tabular mt-3 text-lg text-[var(--color-ink)]">{h.value}</p>
							<p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">{h.body}</p>
						</Reveal>
					))}
				</div>
				<div className="mt-8 grid gap-8 sm:grid-cols-2">
					<TermList title="Also included" items={siteConfig.included} mark="+" />
					<TermList title="Not included" items={siteConfig.notIncluded} mark="–" muted />
				</div>
			</section>

			<section aria-labelledby="deposit-heading" className="grid gap-10 border-t border-[var(--color-line)] pt-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
				<div>
					<p className="eyebrow mb-4">Deposit</p>
					<h2 id="deposit-heading" className="sr-only">
						Deposit and requirements
					</h2>
					<p className="tabular text-[clamp(2rem,4vw,3.2rem)] leading-none text-[var(--color-ink)]">
						{content ? formatMoney(content.depositAed, currency) : 'Per car'}
					</p>
					<p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)]">
						Held on a credit card at handover, never charged online. Released after the car is back and Salik and fines are checked, usually within 14 days.
					</p>
					{content ? (
						<p className="mt-8 flex items-baseline gap-3">
							<span className="eyebrow">Minimum age</span>
							<span className="tabular text-2xl text-[var(--color-primary)]">{content.minAge}</span>
						</p>
					) : null}
				</div>
				<ul className="flex flex-col">
					{requirements.map((r, i) => (
						<li key={r.title} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-[var(--color-line)] py-5 first:pt-0">
							<span className="tabular text-sm text-[var(--color-primary)]">{String(i + 1).padStart(2, '0')}</span>
							<div>
								<p className="text-[var(--color-ink)]">
									{i === 0 && content ? `Age ${content.minAge} or over for this car` : r.title}
								</p>
								<p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">{r.body}</p>
							</div>
						</li>
					))}
					<li className="pt-5">
						<Link href="/how-it-works" className="link-underline text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
							How a rental works
						</Link>
					</li>
				</ul>
			</section>
		</div>
	);
}

function TermList({ title, items, mark, muted }: { title: string; items: readonly string[]; mark: string; muted?: boolean }) {
	return (
		<div>
			<p className="eyebrow mb-4">{title}</p>
			<ul className="flex flex-col gap-2.5">
				{items.map((item) => (
					<li key={item} className="flex gap-3 text-sm leading-relaxed">
						<span aria-hidden className={muted ? 'tabular text-[var(--color-ink-dim)]' : 'tabular text-[var(--color-primary)]'}>
							{mark}
						</span>
						<span className={muted ? 'text-[var(--color-ink-muted)]' : 'text-[var(--color-ink)]'}>{item}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
