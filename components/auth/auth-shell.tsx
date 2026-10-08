import Link from 'next/link';
import { clsx } from 'clsx';
import { Wordmark } from '@/components/layout/wordmark';
import { Reveal, RevealText } from '@/components/motion/reveal';
import { SafeImage } from '@/components/ui/safe-image';

const SIDE_IMAGE = '/images/lifestyle/key-handover.jpg';

export interface AuthShellProps {
	eyebrow?: string;
	/** Display heading. Use `\n` for deliberate line breaks. */
	title: string;
	intro?: React.ReactNode;
	/** Centre the copy (status screens: verifying, link resolving, errors). */
	centered?: boolean;
	children?: React.ReactNode;
	/** Line under the card (e.g. "Don't have an account? Sign up"). */
	footer?: React.ReactNode;
}

/**
 * Split auth layout: a dark lifestyle image with the wordmark on large screens,
 * the form on the right. On phones it collapses to a single column. Server
 * component: interactive children are passed in from the client pages.
 */
export function AuthShell({ eyebrow = 'NOIR Drive account', title, intro, centered, children, footer }: AuthShellProps) {
	return (
		<section className="relative grid min-h-screen bg-[var(--color-bg)] lg:grid-cols-[1.05fr_1fr]">
			<aside className="image-placeholder relative hidden overflow-hidden lg:block" aria-hidden>
				<SafeImage src={SIDE_IMAGE} alt="" fill sizes="50vw" className="object-cover opacity-70" priority />
				<div className="scrim-bottom absolute inset-0" />
				<div className="absolute inset-x-0 bottom-0 p-12">
					<Wordmark layout="stacked" className="text-6xl" />
					<p className="mt-8 max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)]">
						Your bookings, handover times and receipts in one place.
					</p>
				</div>
			</aside>

			<div className="flex items-center justify-center px-6 pt-32 pb-20 lg:px-16">
				<div className={clsx('w-full max-w-[420px]', centered && 'text-center')}>
					<Link href="/" className="mb-12 inline-block lg:hidden" aria-label="NOIR Drive home">
						<Wordmark className="text-3xl" />
					</Link>
					<p className="eyebrow mb-5">{eyebrow}</p>
					<RevealText
						as="h1"
						text={title}
						trigger="mount"
						className="heading-display text-[clamp(2rem,4vw,3rem)] text-[var(--color-ink)]"
						lineClassName="pb-[0.06em]"
					/>
					{intro ? <div className="mt-5 text-sm leading-relaxed text-[var(--color-ink-muted)]">{intro}</div> : null}
					<Reveal delay={0.15} className="mt-10">
						{children}
					</Reveal>
					{footer ? (
						<div className="mt-10 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-ink-muted)]">{footer}</div>
					) : null}
				</div>
			</div>
		</section>
	);
}

/** Inline champagne link used in auth footers. */
export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<Link href={href} className="link-underline text-[var(--color-ink)] hover:text-[var(--color-primary-bright)]">
			{children}
		</Link>
	);
}
