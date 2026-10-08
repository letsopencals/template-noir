import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { Reveal, RevealImage } from '@/components/motion/reveal';
import { SectionHeading } from './section-heading';
import { CONTAINER, SECTION_Y } from './styles';

export interface SplitFeatureProps {
	eyebrow: string;
	title: string;
	index?: string;
	image: string;
	imageAlt: string;
	/** Image on the right on desktop. Default false (left). */
	reverse?: boolean;
	children: React.ReactNode;
	className?: string;
}

/** Image + copy split used across the marketing pages (airport, garage, about). */
export function SplitFeature({ eyebrow, title, index, image, imageAlt, reverse, children, className }: SplitFeatureProps) {
	return (
		<section className={clsx(SECTION_Y, 'border-t border-[var(--color-line)]', className)}>
			<div className={clsx(CONTAINER, 'grid items-center gap-12 lg:grid-cols-12 lg:gap-10')}>
				<RevealImage
					from={reverse ? 'left' : 'right'}
					className={clsx('image-placeholder aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]', reverse ? 'lg:order-2 lg:col-span-6 lg:col-start-7' : 'lg:col-span-6')}
				>
					<SafeImage src={image} alt={imageAlt} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
				</RevealImage>
				<div className={clsx(reverse ? 'lg:order-1 lg:col-span-5' : 'lg:col-span-5 lg:col-start-8')}>
					<SectionHeading index={index} eyebrow={eyebrow} title={title} />
					<Reveal delay={0.15} className="mt-8">
						{children}
					</Reveal>
				</div>
			</div>
		</section>
	);
}
