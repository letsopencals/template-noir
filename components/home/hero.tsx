import Link from 'next/link';
import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { buttonClasses } from '@/components/ui/button';
import { SafeImage } from '@/components/ui/safe-image';
import { Reveal, RevealText } from '@/components/motion/reveal';
import { DriveIn } from '@/components/motion/drive-in';
import { MagneticButton } from '@/components/motion/magnetic-button';
import { CONTAINER, FEATHER_MASK } from '@/components/marketing/styles';
import { formatWholePrice } from '@/components/marketing/format';
import { HeroVideo } from './hero-video';
import { DubaiClock } from './dubai-clock';
import { QuickBookingBar } from './quick-booking-bar';
import type { HomeCar } from './types';

export interface HeroProps {
	/** Cars for the quick booking bar's car picker. */
	cars: HomeCar[];
	/** The car that drives in under the wordmark (usually the flagship). */
	lead: HomeCar | null;
}

/**
 * Home hero. First viewport: background video (→ poster → gradient), a giant
 * outlined NOIR wordmark revealed through a line mask with the headline over
 * its lower edge, and the quick booking bar. Directly beneath, on the black
 * "stage", the lead car drives in with its name and daily price.
 */
export function Hero({ cars, lead }: HeroProps) {
	const { hero, logo, contact } = siteConfig;

	return (
		<section className="relative isolate overflow-hidden bg-[var(--color-bg)]">
			{/* ---------------------------------------------------- Viewport 1 */}
			<div className="relative flex min-h-[100svh] flex-col">
				<HeroVideo src={hero.video} poster={hero.image} />
				<div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.7)_0%,rgba(5,5,5,0.15)_35%,rgba(5,5,5,0.55)_70%,#050505_100%)]" />
				<div aria-hidden className="grain absolute inset-0" />

				<div className={clsx(CONTAINER, 'relative z-10 flex flex-1 flex-col pb-6 pt-28 lg:pb-10 lg:pt-32')}>
					<Reveal delay={0.1} className="flex items-center justify-between gap-6">
						<p className="eyebrow">{hero.eyebrow}</p>
						<p className="eyebrow hidden items-center gap-3 sm:flex">
							<span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
							{contact.addressShort.split(',')[0]} <DubaiClock className="text-[var(--color-ink)]" />
						</p>
					</Reveal>

					<div className="mt-auto pt-10">
						<RevealText
							as="p"
							text={logo.text}
							trigger="mount"
							delay={0.15}
							className="heading-display pointer-events-none -ml-[0.04em] select-none text-[clamp(5.5rem,23vw,26rem)] leading-[0.8] tracking-[-0.03em] text-transparent [-webkit-text-stroke:1px_rgba(244,241,234,0.3)]"
							lineClassName="pb-[0.02em]"
						/>
						<div className="relative -mt-[6vw] grid items-end gap-7 lg:-mt-[7vw] lg:grid-cols-[1.2fr_1fr] lg:gap-16">
							<RevealText
								as="h1"
								text={hero.heading}
								trigger="mount"
								delay={0.45}
								className="heading-display text-[clamp(2.6rem,7vw,6.75rem)] text-[var(--color-ink)]"
								lineClassName="pb-[0.05em]"
							/>
							<Reveal delay={0.8} className="lg:pb-3">
								<p className="max-w-md text-base leading-relaxed text-[var(--color-ink-muted)] lg:text-lg">{hero.body}</p>
								<div className="mt-7 flex flex-wrap gap-3">
									<MagneticButton>
										<Link href={hero.primaryCta.href} className={buttonClasses('primary', 'lg')}>
											{hero.primaryCta.label}
										</Link>
									</MagneticButton>
									<Link href={hero.secondaryCta.href} className={buttonClasses('outline', 'lg')}>
										{hero.secondaryCta.label}
									</Link>
								</div>
							</Reveal>
						</div>
					</div>

					<Reveal delay={0.9} className="relative z-20 mt-10 lg:mt-14">
						<QuickBookingBar cars={cars} />
					</Reveal>
				</div>
			</div>

			{/* ------------------------------------------------------- Stage */}
			{lead ? (
				<div className={clsx(CONTAINER, 'relative pb-20 pt-6 lg:pb-28')}>
					<DriveIn from="left" distance={45} className="mx-auto aspect-[16/9] w-full max-w-[1300px]">
						<div className={clsx('image-placeholder absolute inset-0', FEATHER_MASK)}>
							<SafeImage src={lead.image} alt={lead.title} fill sizes="(min-width:1300px) 1300px, 100vw" className="object-contain" />
						</div>
					</DriveIn>
					<Reveal className="mx-auto mt-2 flex max-w-[1300px] flex-col gap-5 border-t border-[var(--color-line)] pt-6 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="eyebrow mb-2">{lead.categoryLabel ?? 'Flagship'}</p>
							<p className="heading-display text-2xl text-[var(--color-ink)] lg:text-3xl">{lead.title}</p>
							{lead.tagline ? <p className="mt-2 max-w-md text-sm text-[var(--color-ink-muted)]">{lead.tagline}</p> : null}
						</div>
						<div className="flex items-end justify-between gap-6 sm:justify-end">
							{lead.pricePerDay !== null ? (
								<p className="sm:text-right">
									<span className="eyebrow block">From</span>
									<span className="tabular text-xl text-[var(--color-ink)]">{formatWholePrice(lead.pricePerDay, lead.currency)}</span>
									<span className="text-sm text-[var(--color-ink-muted)]"> / day</span>
								</p>
							) : null}
							<Link href={`/fleet/${lead.slug}`} className={buttonClasses('outline', 'md')}>
								View car
							</Link>
						</div>
					</Reveal>
				</div>
			) : null}
		</section>
	);
}
