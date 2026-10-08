import Link from 'next/link';
import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { SafeImage } from '@/components/ui/safe-image';
import { buttonClasses } from '@/components/ui/button';
import { Reveal, RevealImage } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { CONTAINER, SECTION_Y } from '@/components/marketing/styles';

const SECOND_IMAGE = '/images/chauffeur/rear-cabin.jpg';

/** Home §6: chauffeur teaser (two offset images + points) → /chauffeur. */
export function ChauffeurTeaser() {
	const { chauffeur } = siteConfig;
	return (
		<section className={clsx(SECTION_Y, 'border-t border-[var(--color-line)] bg-[var(--color-surface)]')}>
			<div className={clsx(CONTAINER, 'grid gap-14 lg:grid-cols-12 lg:gap-10')}>
				<div className="relative lg:col-span-6">
					<RevealImage from="up" className="image-placeholder aspect-[4/5] w-[86%]">
						<SafeImage src={chauffeur.image} alt="A chauffeur waiting at a hotel entrance" fill sizes="(min-width:1024px) 42vw, 86vw" className="object-cover" />
					</RevealImage>
					<RevealImage from="left" delay={0.25} className="image-placeholder absolute bottom-[-8%] right-0 aspect-[4/5] w-[42%] border-4 border-[var(--color-surface)]">
						<SafeImage src={SECOND_IMAGE} alt="The rear cabin" fill sizes="(min-width:1024px) 20vw, 42vw" className="object-cover" />
					</RevealImage>
				</div>

				<div className="flex flex-col justify-center pt-10 lg:col-span-5 lg:col-start-8 lg:pt-0">
					<SectionHeading index="05" eyebrow={chauffeur.eyebrow} title={chauffeur.heading} sizeClassName="text-[clamp(2.6rem,7vw,6rem)]" />
					<Reveal delay={0.15}>
						<p className="mt-8 max-w-md leading-relaxed text-[var(--color-ink-muted)]">{chauffeur.body}</p>
					</Reveal>
					<ul className="mt-10 border-t border-[var(--color-line)]">
						{chauffeur.points.map((point, i) => (
							<Reveal as="li" key={point} delay={0.2 + i * 0.08} className="flex gap-5 border-b border-[var(--color-line)] py-4 text-sm text-[var(--color-ink)]">
								<span className="tabular text-[var(--color-primary)]">{String(i + 1).padStart(2, '0')}</span>
								{point}
							</Reveal>
						))}
					</ul>
					<Reveal delay={0.5} className="mt-10">
						<Link href="/chauffeur" className={buttonClasses('outline', 'lg')}>
							Book a chauffeur
						</Link>
					</Reveal>
				</div>
			</div>
		</section>
	);
}
