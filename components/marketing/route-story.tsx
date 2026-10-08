import { Fragment } from 'react';
import { clsx } from 'clsx';
import { SafeImage } from '@/components/ui/safe-image';
import { Reveal, RevealImage, type RevealImageProps } from '@/components/motion/reveal';

export interface RouteStoryImage {
	src: string;
	alt: string;
	/** 'wide' spans the column; 'pair' images sit two-up. */
	layout: 'wide' | 'pair';
}

export interface RouteStoryProps {
	intro: string;
	body: string[];
	/** Interleaved after each paragraph, in order. Leftovers render at the end. */
	images: RouteStoryImage[];
	className?: string;
}

const PAIR_FROM: RevealImageProps['from'][] = ['up', 'down'];

/**
 * Long-form drive: lead paragraph, then the body with photographs interleaved.
 * Consecutive 'pair' images are grouped into one two-up row.
 */
export function RouteStory({ intro, body, images, className }: RouteStoryProps) {
	const groups = groupImages(images);
	const tail = groups.slice(body.length);

	return (
		<div className={clsx('mx-auto flex max-w-[1100px] flex-col gap-14 lg:gap-20', className)}>
			<Reveal>
				<p className="mx-auto max-w-[760px] text-[clamp(1.25rem,2.2vw,1.75rem)] leading-[1.45] text-[var(--color-ink)]">{intro}</p>
			</Reveal>
			{body.map((paragraph, i) => (
				<Fragment key={i}>
					<Reveal>
						<p className="mx-auto max-w-[680px] text-base leading-[1.8] text-[var(--color-ink-muted)] lg:text-lg">{paragraph}</p>
					</Reveal>
					{groups[i] ? <ImageGroup group={groups[i]} /> : null}
				</Fragment>
			))}
			{tail.map((g, i) => (
				<ImageGroup key={`tail-${i}`} group={g} />
			))}
		</div>
	);
}

function groupImages(images: RouteStoryImage[]): RouteStoryImage[][] {
	const out: RouteStoryImage[][] = [];
	for (const img of images) {
		const last = out[out.length - 1];
		if (img.layout === 'pair' && last && last.length === 1 && last[0]?.layout === 'pair') last.push(img);
		else out.push([img]);
	}
	return out;
}

function ImageGroup({ group }: { group: RouteStoryImage[] }) {
	const first = group[0];
	if (group.length === 1 && first && first.layout === 'wide') {
		const img = first;
		return (
			<RevealImage from="up" className="image-placeholder aspect-[16/9] w-full">
				<SafeImage src={img.src} alt={img.alt} fill sizes="(min-width:1100px) 1100px, 100vw" className="object-cover" />
			</RevealImage>
		);
	}
	return (
		<div className="grid grid-cols-2 gap-3 sm:gap-6">
			{group.map((img, i) => (
				<RevealImage key={img.src} from={PAIR_FROM[i % 2]} delay={i * 0.12} className="image-placeholder aspect-[4/5] w-full">
					<SafeImage src={img.src} alt={img.alt} fill sizes="(min-width:1100px) 540px, 50vw" className="object-cover" />
				</RevealImage>
			))}
		</div>
	);
}
