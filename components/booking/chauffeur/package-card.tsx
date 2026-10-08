import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
import { formatDuration, formatWholePrice } from '@/lib/format';

/** Server-mapped chauffeur package (no staff, no internal ids beyond the slug). */
export interface ChauffeurPackage {
	slug: string;
	title: string;
	description: string;
	price: number;
	currency: string;
	/** Base duration in seconds. */
	duration: number;
	/** True for "by the hour": the guest picks the length on the booking page. */
	custom: boolean;
	/** Longest booking in seconds (custom packages), or 0. */
	maxDuration: number;
	image: string | null;
}

function priceLine(p: ChauffeurPackage): string {
	const price = formatWholePrice(p.price, p.currency);
	if (!p.custom) return price;
	return `${price} / ${p.duration === 3600 ? 'hour' : formatDuration(p.duration)}`;
}

function lengthLine(p: ChauffeurPackage): string {
	if (!p.custom) return formatDuration(p.duration);
	const max = p.maxDuration > 0 ? ` · up to ${formatDuration(p.maxDuration)}` : '';
	return `From ${formatDuration(p.duration)}${max}`;
}

/** One package: image, index, title, length, price, CTA to the classic flow. */
export function PackageCard({ pkg, index }: { pkg: ChauffeurPackage; index: number }) {
	return (
		<Link
			href={`/booking/${pkg.slug}`}
			className="group flex h-full flex-col border border-[var(--color-line)] bg-[var(--color-surface)] transition-colors duration-500 hover:border-[var(--color-primary-dark)]"
		>
			<div className="image-placeholder relative aspect-[4/3] overflow-hidden">
				<SafeImage
					src={pkg.image}
					alt={pkg.title}
					fill
					sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
					className="object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.04]"
				/>
				<span className="tabular absolute left-4 top-4 bg-black/60 px-2 py-1 text-[0.62rem] tracking-[0.2em] text-[var(--color-ink-muted)] backdrop-blur-sm">
					{String(index + 1).padStart(2, '0')}
				</span>
			</div>
			<div className="flex flex-1 flex-col p-6">
				<p className="tabular text-[0.62rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]">{lengthLine(pkg)}</p>
				<h2 className="heading-display mt-3 text-lg leading-tight text-[var(--color-ink)]">{pkg.title}</h2>
				{pkg.description ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">{pkg.description}</p> : null}
				<div className="mt-auto flex items-end justify-between gap-4 border-t border-[var(--color-line)] pt-5">
					<span className="tabular text-base text-[var(--color-primary)]">{priceLine(pkg)}</span>
					<span className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-primary)]">
						Book <span aria-hidden>→</span>
					</span>
				</div>
			</div>
		</Link>
	);
}
