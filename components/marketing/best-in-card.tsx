import Link from 'next/link';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { buttonClasses } from '@/components/ui/button';
import { DriveIn } from '@/components/motion/drive-in';
import { FEATHER_MASK } from './styles';
import { formatWholePrice } from './format';

export interface BestInCardProps {
	slug: string;
	title: string;
	tagline: string | null;
	image: string;
	pricePerDay: number | null;
	currency: string;
	routeTitle: string;
	className?: string;
}

/** "Best in the …" panel at the end of a drive: the car drives in, with a link to it and to booking. */
export function BestInCard({ slug, title, tagline, image, pricePerDay, currency, routeTitle, className }: BestInCardProps) {
	return (
		<aside className={clsx('relative overflow-hidden border border-[var(--color-line)] bg-[var(--color-bg-deep)] p-6 sm:p-10 lg:p-14', className)}>
			<p className="eyebrow mb-4">The car for {routeTitle}</p>
			<h2 className="heading-display text-[clamp(1.8rem,4vw,3.4rem)] text-[var(--color-ink)]">{title}</h2>
			{tagline ? <p className="mt-4 max-w-md text-[var(--color-ink-muted)]">{tagline}</p> : null}
			<DriveIn from="right" className="mx-auto my-6 aspect-[16/9] w-full max-w-[900px]">
				<div className={clsx('image-placeholder absolute inset-0', FEATHER_MASK)}>
					<SafeImage src={image} alt={title} fill sizes="(min-width:900px) 900px, 100vw" className="object-contain" />
				</div>
			</DriveIn>
			<div className="flex flex-col gap-5 border-t border-[var(--color-line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
				{pricePerDay !== null ? (
					<p className="text-sm text-[var(--color-ink-muted)]">
						from <span className="tabular text-lg text-[var(--color-ink)]">{formatWholePrice(pricePerDay, currency)}</span> / day
					</p>
				) : (
					<span />
				)}
				<div className="flex flex-wrap gap-3">
					<Link href={`/fleet/${slug}`} className={buttonClasses('outline', 'md')}>
						View car
					</Link>
					<Link href={`/book?car=${encodeURIComponent(slug)}`} className={buttonClasses('primary', 'md')}>
						Book this car
					</Link>
				</div>
			</div>
		</aside>
	);
}
