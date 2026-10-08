import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/marketing/section-heading';
import { CONTAINER, SECTION_Y } from '@/components/marketing/styles';

const FAQ_ITEMS = siteConfig.faqs.map((f) => ({ q: f.question, a: f.answer }));

/** Home §9b: FAQ accordion beside a heading and a WhatsApp nudge. */
export function FaqSection() {
	const { contact } = siteConfig;
	return (
		<section className={SECTION_Y}>
			<div className={clsx(CONTAINER, 'grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16')}>
				<div>
					<SectionHeading index="08" eyebrow={siteConfig.marketing.faqEyebrow} title={'Before\nyou book.'} />
					<Reveal delay={0.15}>
						<p className="mt-8 max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)]">
							Anything else, ask the concierge on{' '}
							<a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="link-underline text-[var(--color-primary)]">
								WhatsApp
							</a>
							.
						</p>
					</Reveal>
				</div>
				<Reveal delay={0.1}>
					<FaqAccordion items={FAQ_ITEMS} />
				</Reveal>
			</div>
		</section>
	);
}
