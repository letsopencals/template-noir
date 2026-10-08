import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import { buttonClasses } from '@/components/ui/button';
import { PageHeading } from '@/components/ui/page-heading';
import { Reveal } from '@/components/motion/reveal';
import { ContactChannels, type ContactChannel } from '@/components/marketing/contact-channels';
import { DubaiMap } from '@/components/marketing/dubai-map';
import { MapFrame } from '@/components/marketing/map-frame';
import { CONTAINER } from '@/components/marketing/styles';

export const metadata: Metadata = {
	title: 'Contact',
	description: 'Message the concierge on WhatsApp, call, or visit the garage in Al Quoz.',
};

export default function Page() {
	const { contact } = siteConfig;
	const copy = siteConfig.marketing.contact;
	const whatsappHours = contact.hours.find((h) => h.label.startsWith('WhatsApp'))?.value;

	const channels: ContactChannel[] = [
		{ key: 'whatsapp', label: 'WhatsApp', value: contact.whatsapp, href: contact.whatsappHref, action: 'Message us', note: whatsappHours, external: true, primary: true },
		{ key: 'phone', label: 'Phone', value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}`, action: 'Call' },
		{ key: 'email', label: 'Email', value: contact.email, href: `mailto:${contact.email}`, action: 'Email' },
	];

	return (
		<>
			<PageHeading eyebrow={copy.eyebrow} title={copy.heading} intro={copy.intro} />

			<section className={`${CONTAINER} pb-[var(--spacing-section-sm)] lg:pb-[var(--spacing-section)]`}>
				<ContactChannels channels={channels} />
			</section>

			<section className={`${CONTAINER} grid gap-12 pb-[var(--spacing-section-sm)] lg:grid-cols-12 lg:gap-10 lg:pb-[var(--spacing-section)]`}>
				<div className="flex flex-col gap-10 lg:col-span-4">
					<Reveal>
						<p className="eyebrow mb-4">The garage</p>
						<address className="whitespace-pre-line text-lg not-italic leading-relaxed text-[var(--color-ink)]">{contact.address}</address>
						<a href={contact.mapHref} target="_blank" rel="noopener noreferrer" className={`${buttonClasses('outline', 'md')} mt-6`}>
							Directions
						</a>
					</Reveal>
					<Reveal delay={0.1}>
						<p className="eyebrow mb-4">Hours</p>
						<dl className="flex flex-col">
							{contact.hours.map((h) => (
								<div key={h.label} className="flex flex-col gap-1 border-t border-[var(--color-line)] py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
									<dt className="text-sm text-[var(--color-ink-muted)]">{h.label}</dt>
									<dd className="tabular text-sm text-[var(--color-ink)]">{h.value}</dd>
								</div>
							))}
						</dl>
					</Reveal>
					{contact.socials.length > 0 ? (
						<Reveal delay={0.2}>
							<p className="eyebrow mb-4">Follow</p>
							<ul className="flex flex-wrap gap-6">
								{contact.socials.map((s) => (
									<li key={s.label}>
										<a href={s.href} target="_blank" rel="noopener noreferrer" className="link-underline text-sm text-[var(--color-ink)]">
											{s.label}
										</a>
									</li>
								))}
							</ul>
						</Reveal>
					) : null}
				</div>
				<div className="lg:col-span-8">
					<MapFrame caption={`NOIR garage · ${contact.addressShort}`}>
						<DubaiMap variant="garage" />
					</MapFrame>
				</div>
			</section>
		</>
	);
}
