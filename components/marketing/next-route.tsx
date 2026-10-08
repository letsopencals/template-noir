import Link from 'next/link';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';

export interface NextRouteProps {
	slug: string;
	title: string;
	region: string;
	image: string;
	className?: string;
}

/** Full-bleed "next drive" link at the foot of a journal entry. */
export function NextRoute({ slug, title, region, image, className }: NextRouteProps) {
	return (
		<Link href={`/journal/${slug}`} className={clsx('group/next relative block overflow-hidden', className)}>
			<div className="image-placeholder relative h-[46svh] min-h-[300px] w-full">
				<SafeImage
					src={image}
					alt=""
					fill
					sizes="100vw"
					className="object-cover opacity-60 transition-[transform,opacity] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/next:scale-[1.04] group-hover/next:opacity-80"
				/>
				<div aria-hidden className="scrim-bottom absolute inset-0" />
			</div>
			<div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1600px] items-end justify-between gap-6 px-5 pb-10 lg:px-10 lg:pb-14">
				<div>
					<p className="eyebrow mb-3">Next drive · {region}</p>
					<p className="heading-display text-[clamp(2rem,5.5vw,5rem)] text-[var(--color-ink)]">{title}</p>
				</div>
				<span
					aria-hidden
					className="mb-2 flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--color-line-strong)] text-[var(--color-ink)] transition-colors duration-500 group-hover/next:border-[var(--color-primary)] group-hover/next:bg-[var(--color-primary)] group-hover/next:text-black"
				>
					<svg className="h-3 w-4" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.3">
						<path d="M0 6h14M9.5 1.5 14 6l-4.5 4.5" />
					</svg>
				</span>
			</div>
		</Link>
	);
}
