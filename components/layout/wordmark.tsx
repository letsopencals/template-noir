import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';

export interface WordmarkProps {
	className?: string;
	/** 'inline' = NOIR + small DRIVE on one line (header); 'stacked' = DRIVE under NOIR. */
	layout?: 'inline' | 'stacked';
}

/**
 * Text wordmark: "NOIR" in the expanded display face with a thin, letterspaced
 * "DRIVE". Sized by the parent's font-size (set text-* on `className`).
 */
export function Wordmark({ className, layout = 'inline' }: WordmarkProps) {
	return (
		<span
			className={clsx(
				'inline-flex select-none text-[var(--color-ink)]',
				layout === 'stacked' ? 'flex-col items-start leading-none' : 'items-baseline gap-[0.45em]',
				className,
			)}
			aria-label={`${siteConfig.logo.text} ${siteConfig.logo.accent}`}
		>
			<span className="font-display font-semibold uppercase leading-none tracking-[0.04em] [font-stretch:125%]">
				{siteConfig.logo.text}
			</span>
			<span
				className={clsx(
					'font-body font-normal uppercase leading-none tracking-[0.5em] text-[var(--color-primary)]',
					layout === 'stacked' ? 'mt-[0.5em] text-[0.32em]' : 'text-[0.38em]',
				)}
			>
				{siteConfig.logo.accent}
			</span>
		</span>
	);
}
