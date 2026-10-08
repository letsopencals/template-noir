import { clsx } from 'clsx';
import { SectionHeading } from './section-heading';
import { CONTAINER, SECTION_Y } from './styles';

export interface PageSectionProps {
	eyebrow: string;
	title: string;
	index?: string;
	intro?: string;
	children: React.ReactNode;
	className?: string;
	/** Hairline above the section (default true). */
	divider?: boolean;
	id?: string;
}

/** A marketing-page section: heading (+ optional intro) then content, in the page container. */
export function PageSection({ eyebrow, title, index, intro, children, className, divider = true, id }: PageSectionProps) {
	return (
		<section id={id} className={clsx(SECTION_Y, divider && 'border-t border-[var(--color-line)]', className)}>
			<div className={CONTAINER}>
				<div className="mb-12 grid gap-6 lg:mb-16 lg:grid-cols-2 lg:items-end">
					<SectionHeading index={index} eyebrow={eyebrow} title={title} />
					{intro ? <p className="max-w-md leading-relaxed text-[var(--color-ink-muted)] lg:ml-auto">{intro}</p> : null}
				</div>
				{children}
			</div>
		</section>
	);
}
