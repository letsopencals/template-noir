import { clsx } from 'clsx';
import { RevealText } from '@/components/motion/reveal';

export interface PageHeadingProps {
	eyebrow?: string;
	/** Use `\n` for deliberate line breaks. */
	title: string;
	intro?: string;
	className?: string;
	children?: React.ReactNode;
}

/** Standard top-of-page heading block (clears the fixed header). */
export function PageHeading({ eyebrow, title, intro, className, children }: PageHeadingProps) {
	return (
		<header className={clsx('mx-auto max-w-[1400px] px-6 pt-40 pb-16 lg:px-10 lg:pt-48', className)}>
			{eyebrow ? <p className="eyebrow mb-6">{eyebrow}</p> : null}
			<RevealText
				as="h1"
				text={title}
				trigger="mount"
				className="heading-display text-[clamp(2.5rem,7vw,6.5rem)] text-[var(--color-ink)]"
				lineClassName="pb-[0.06em]"
			/>
			{intro ? <p className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--color-ink-muted)]">{intro}</p> : null}
			{children}
		</header>
	);
}
