import { clsx } from 'clsx';
import { RevealText } from '@/components/motion/reveal';

export interface SectionHeadingProps {
	eyebrow: string;
	/** Use `\n` for deliberate line breaks. */
	title: string;
	/** Optional two-digit index shown before the eyebrow ("02"). */
	index?: string;
	as?: 'h2' | 'h3';
	className?: string;
	/** Tailwind text-size class for the title. */
	sizeClassName?: string;
}

/** Eyebrow (with an optional index and hairline) above a line-masked display title. */
export function SectionHeading({
	eyebrow,
	title,
	index,
	as = 'h2',
	className,
	sizeClassName = 'text-[clamp(2.1rem,5.4vw,4.75rem)]',
}: SectionHeadingProps) {
	return (
		<div className={className}>
			<p className="eyebrow mb-6 flex items-center gap-4">
				{index ? <span className="tabular text-[var(--color-primary)]">{index}</span> : null}
				{index ? <span aria-hidden className="h-px w-10 bg-[var(--color-line-strong)]" /> : null}
				<span>{eyebrow}</span>
			</p>
			<RevealText
				as={as}
				text={title}
				className={clsx('heading-display text-[var(--color-ink)]', sizeClassName)}
				lineClassName="pb-[0.06em]"
			/>
		</div>
	);
}
