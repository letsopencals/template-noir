import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { RevealText } from '@/components/motion/reveal';

/**
 * Site footer (Server Component): contact + hours + link columns, then the
 * giant NOIR wordmark revealing from behind a mask, and the legal line.
 */
export function Footer() {
	const { contact, footerColumns, legal } = siteConfig;
	const year = new Date().getFullYear();

	return (
		<footer className="relative overflow-hidden border-t border-[var(--color-line)] bg-[var(--color-bg-deep)] text-[var(--color-ink)]">
			<div className="mx-auto max-w-[1600px] px-5 lg:px-10">
				<div className="grid gap-14 py-20 lg:grid-cols-[1.2fr_2fr] lg:py-28">
					{/* Garage + contact */}
					<div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-1">
						<div className="space-y-3">
							<p className="eyebrow">Garage</p>
							<address className="whitespace-pre-line text-sm not-italic leading-relaxed text-[var(--color-ink-muted)]">
								{contact.address}
							</address>
							<a
								href={contact.mapHref}
								target="_blank"
								rel="noopener noreferrer"
								className="link-underline text-[0.68rem] uppercase tracking-[0.24em] text-[var(--color-primary)]"
							>
								Directions
							</a>
						</div>
						<div className="space-y-3">
							<p className="eyebrow">Hours</p>
							<dl className="space-y-1.5 text-sm">
								{contact.hours.map((h) => (
									<div key={h.label} className="flex gap-4">
										<dt className="w-44 shrink-0 text-[var(--color-ink-dim)]">{h.label}</dt>
										<dd className="tabular text-[var(--color-ink-muted)]">{h.value}</dd>
									</div>
								))}
							</dl>
						</div>
						<div className="space-y-2 text-sm">
							<p className="eyebrow">Concierge</p>
							<a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="block text-[var(--color-ink)] hover:text-[var(--color-primary-bright)]">
								WhatsApp <span className="tabular">{contact.whatsapp}</span>
							</a>
							<a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="tabular block text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
								{contact.phone}
							</a>
							<a href={`mailto:${contact.email}`} className="block text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
								{contact.email}
							</a>
						</div>
					</div>

					{/* Link columns */}
					<nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-4">
						{footerColumns.map((col) => (
							<div key={col.title}>
								<p className="eyebrow">{col.title}</p>
								<ul className="mt-5 space-y-3">
									{col.links.map((link) => (
										<li key={link.href}>
											<Link href={link.href} className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]">
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</nav>
				</div>
			</div>

			{/* Giant wordmark */}
			<div aria-hidden className="pointer-events-none select-none px-3">
				<RevealText
					as="div"
					text={siteConfig.logo.text}
					className="heading-display text-center text-[clamp(6rem,27vw,30rem)] leading-[0.78] tracking-[-0.02em] text-[var(--color-surface-3)]"
					lineClassName="pb-[0.02em]"
					stagger={0}
				/>
			</div>

			<div className="mx-auto max-w-[1600px] px-5 lg:px-10">
				<div className="flex flex-col gap-4 border-t border-[var(--color-line)] py-7 text-xs text-[var(--color-ink-dim)] md:flex-row md:items-center md:justify-between">
					<p>
						&copy; {year} {legal.company}. Dubai, United Arab Emirates.
					</p>
					<div className="flex flex-wrap items-center gap-6">
						{contact.socials.map((s) => (
							<a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="uppercase tracking-[0.24em] hover:text-[var(--color-ink)]">
								{s.label}
							</a>
						))}
						<a href={legal.builtWith.href} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-ink)]">
							{legal.builtWith.label}
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
