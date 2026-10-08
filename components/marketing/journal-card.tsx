import Link from 'next/link';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { Reveal, RevealImage } from '@/components/motion/reveal';

export interface JournalCardProps {
	slug: string;
	title: string;
	region: string;
	intro: string;
	distanceKm: number;
	duration: string;
	image: string;
	bestInTitle: string | null;
	index: number;
	/** Image on the right on desktop. */
	reverse?: boolean;
}

/** One drive on the journal index: large photograph + numbered editorial block. */
export function JournalCard({ slug, title, region, intro, distanceKm, duration, image, bestInTitle, index, reverse }: JournalCardProps) {
	return (
		<article className="grid items-end gap-8 lg:grid-cols-12 lg:gap-10">
			<Link
				href={`/journal/${slug}`}
				aria-label={title}
				className={clsx('group/jc block lg:col-span-7', reverse && 'lg:order-2 lg:col-start-6')}
			>
				<RevealImage from={reverse ? 'left' : 'right'} className="image-placeholder aspect-[4/3] lg:aspect-[16/11]">
					<SafeImage
						src={image}
						alt={`${title}, ${region}`}
						fill
						sizes="(min-width:1024px) 58vw, 100vw"
						className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/jc:scale-[1.04]"
					/>
				</RevealImage>
			</Link>
			<Reveal className={clsx('lg:col-span-5 lg:pb-6', reverse ? 'lg:order-1' : 'lg:col-start-8')}>
				<p className="eyebrow mb-5 flex items-center gap-4">
					<span className="tabular text-[var(--color-primary)]">{String(index + 1).padStart(2, '0')}</span>
					<span aria-hidden className="h-px w-10 bg-[var(--color-line-strong)]" />
					{region}
				</p>
				<h2 className="heading-display mb-5 text-[clamp(2rem,4.6vw,4rem)] text-[var(--color-ink)]">
					<Link href={`/journal/${slug}`} className="transition-colors hover:text-[var(--color-primary-bright)]">
						{title}
					</Link>
				</h2>
				<p className="mb-8 max-w-md leading-relaxed text-[var(--color-ink-muted)]">{intro}</p>
				<dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-[var(--color-line)] pt-5 text-sm">
					<div>
						<dt className="text-[0.58rem] uppercase tracking-[0.26em] text-[var(--color-ink-dim)]">Round trip</dt>
						<dd className="tabular mt-1 text-[var(--color-ink)]">{distanceKm} km</dd>
					</div>
					<div>
						<dt className="text-[0.58rem] uppercase tracking-[0.26em] text-[var(--color-ink-dim)]">Drive</dt>
						<dd className="tabular mt-1 text-[var(--color-ink)]">{duration}</dd>
					</div>
					{bestInTitle ? (
						<div>
							<dt className="text-[0.58rem] uppercase tracking-[0.26em] text-[var(--color-ink-dim)]">Best in</dt>
							<dd className="mt-1 text-[var(--color-primary)]">{bestInTitle}</dd>
						</div>
					) : null}
				</dl>
			</Reveal>
		</article>
	);
}
