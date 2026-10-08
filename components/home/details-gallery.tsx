import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { SafeImage } from '@/components/ui/safe-image';
import { Reveal, RevealImage, type RevealImageProps } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { CONTAINER, SECTION_Y } from '@/components/marketing/styles';

type DetailImage = (typeof siteConfig.marketing.details.images)[number];

interface TileProps {
	image: DetailImage | undefined;
	index: number;
	from: RevealImageProps['from'];
	aspect: string;
	sizes: string;
	className?: string;
}

function Tile({ image, index, from, aspect, sizes, className }: TileProps) {
	if (!image) return null;
	return (
		<figure className={className}>
			<RevealImage from={from} delay={index * 0.08} className={clsx('image-placeholder w-full', aspect)}>
				<SafeImage src={image.src} alt={image.label} fill sizes={sizes} className="object-cover" />
			</RevealImage>
			<figcaption className="mt-3 flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.26em] text-[var(--color-ink-dim)]">
				<span className="tabular text-[var(--color-primary)]">{String(index + 1).padStart(2, '0')}</span>
				{image.label}
			</figcaption>
		</figure>
	);
}

/**
 * Home §7: "details" gallery (leather, brakes, the handover, an arrival) in
 * an offset editorial grid. Each tile wipes in from a different side.
 */
export function DetailsGallery() {
	const copy = siteConfig.marketing.details;
	const [a, b, c, d] = copy.images;
	return (
		<section className={SECTION_Y}>
			<div className={CONTAINER}>
				<div className="mb-14 grid gap-8 lg:mb-20 lg:grid-cols-2 lg:items-end">
					<SectionHeading index="06" eyebrow={copy.eyebrow} title={copy.heading} />
					<Reveal delay={0.15}>
						<p className="max-w-md leading-relaxed text-[var(--color-ink-muted)] lg:ml-auto">{copy.body}</p>
					</Reveal>
				</div>

				<div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-12 md:gap-x-5 md:gap-y-12">
					<Tile image={a} index={0} from="up" aspect="aspect-[4/5]" sizes="(min-width:768px) 58vw, 100vw" className="col-span-2 md:col-span-7" />
					{/* `contents` on mobile so B and C sit side by side in the 2-col grid. */}
					<div className="contents md:col-span-5 md:flex md:flex-col md:gap-12 md:pt-28">
						<Tile image={b} index={1} from="right" aspect="aspect-square" sizes="(min-width:768px) 40vw, 50vw" />
						<Tile image={c} index={2} from="down" aspect="aspect-[3/4]" sizes="(min-width:768px) 26vw, 50vw" className="md:w-2/3 md:self-end" />
					</div>
					<Tile image={d} index={3} from="left" aspect="aspect-[16/9]" sizes="(min-width:768px) 50vw, 100vw" className="col-span-2 md:col-span-6 md:col-start-2 md:-mt-40" />
				</div>
			</div>
		</section>
	);
}
