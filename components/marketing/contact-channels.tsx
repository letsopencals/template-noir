import { clsx } from 'clsx';
import { buttonClasses } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';

export interface ContactChannel {
	key: string;
	label: string;
	value: string;
	href: string;
	/** Button label, e.g. "Message us", "Call". */
	action: string;
	note?: string;
	external?: boolean;
	primary?: boolean;
}

export interface ContactChannelsProps {
	channels: ContactChannel[];
	className?: string;
}

/** Contact methods as large rows; the primary one (WhatsApp) carries a filled button. */
export function ContactChannels({ channels, className }: ContactChannelsProps) {
	return (
		<ul className={clsx('border-t border-[var(--color-line)]', className)}>
			{channels.map((c, i) => (
				<li key={c.key} className="border-b border-[var(--color-line)]">
					<Reveal delay={i * 0.08}>
						<a
							href={c.href}
							target={c.external ? '_blank' : undefined}
							rel={c.external ? 'noopener noreferrer' : undefined}
							className="group/ch flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8 lg:py-9"
						>
							<span className="min-w-0">
								<span className="eyebrow mb-2 block">{c.label}</span>
								<span className="tabular block break-words text-[clamp(1.25rem,3vw,2.25rem)] leading-tight text-[var(--color-ink)] transition-colors duration-300 group-hover/ch:text-[var(--color-primary-bright)]">
									{c.value}
								</span>
								{c.note ? <span className="mt-2 block text-sm text-[var(--color-ink-muted)]">{c.note}</span> : null}
							</span>
							<span aria-hidden className={clsx(buttonClasses(c.primary ? 'primary' : 'outline', 'md'), 'shrink-0 self-start sm:self-auto')}>
								{c.action}
							</span>
						</a>
					</Reveal>
				</li>
			))}
		</ul>
	);
}
