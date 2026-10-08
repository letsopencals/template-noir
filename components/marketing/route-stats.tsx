import Link from 'next/link';
import { clsx } from 'clsx';
import { CountUp } from '@/components/motion/count-up';

export interface RouteStatsProps {
	distanceKm: number;
	duration: string;
	bestTime: string;
	bestIn: { slug: string; title: string } | null;
	className?: string;
}

/** Spec strip for a drive: round trip, time each way, when to go, the car. */
export function RouteStats({ distanceKm, duration, bestTime, bestIn, className }: RouteStatsProps) {
	return (
		<dl className={clsx('grid grid-cols-2 gap-px border-y border-[var(--color-line)] bg-[var(--color-line)] lg:grid-cols-4', className)}>
			<Stat label="Round trip">
				<span className="text-[clamp(1.6rem,3.4vw,2.6rem)] leading-none">
					<CountUp value={distanceKm} />
					<span className="ml-1.5 text-[0.4em] uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">km</span>
				</span>
			</Stat>
			<Stat label="Each way">
				<span className="tabular text-lg leading-snug">{duration.replace(/ each way$/, '')}</span>
			</Stat>
			<Stat label="When to go">
				<span className="text-sm leading-snug text-[var(--color-ink)]">{bestTime}</span>
			</Stat>
			<Stat label="Best in">
				{bestIn ? (
					<Link href={`/fleet/${bestIn.slug}`} className="link-underline text-sm text-[var(--color-primary-bright)]">
						{bestIn.title}
					</Link>
				) : (
					<span className="text-sm text-[var(--color-ink-muted)]">Any car in the fleet</span>
				)}
			</Stat>
		</dl>
	);
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col justify-between gap-4 bg-[var(--color-bg)] px-5 py-6 sm:px-7 sm:py-8">
			<dt className="text-[0.6rem] uppercase tracking-[0.26em] text-[var(--color-ink-dim)]">{label}</dt>
			<dd className="text-[var(--color-ink)]">{children}</dd>
		</div>
	);
}
