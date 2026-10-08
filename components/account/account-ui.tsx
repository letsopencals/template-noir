import { clsx } from 'clsx';
import Link from 'next/link';
import { RevealText } from '@/components/motion/reveal';

/** Top-of-page heading inside the account area. */
export function AccountHeading({
	eyebrow,
	title,
	intro,
	action,
}: {
	eyebrow?: string;
	title: string;
	intro?: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--color-line)] pb-8">
			<div>
				{eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
				<RevealText
					as="h1"
					text={title}
					trigger="mount"
					className="heading-display text-[clamp(1.9rem,4vw,3.2rem)] text-[var(--color-ink)]"
					lineClassName="pb-[0.06em]"
				/>
				{intro ? <div className="mt-4 text-sm text-[var(--color-ink-muted)]">{intro}</div> : null}
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}

/** Hairline panel with a small uppercase title. */
export function Panel({
	title,
	action,
	children,
	className,
}: {
	title?: React.ReactNode;
	action?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<section className={clsx('border border-[var(--color-line)] bg-[var(--color-surface)] p-6 lg:p-7', className)}>
			{title || action ? (
				<div className="mb-5 flex items-center justify-between gap-4">
					{title ? <h2 className="eyebrow text-[var(--color-ink)]">{title}</h2> : <span />}
					{action}
				</div>
			) : null}
			{children}
		</section>
	);
}

/** Small uppercase champagne text link ("View all"). */
export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<Link
			href={href}
			className="text-[0.64rem] font-medium uppercase tracking-[0.24em] text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-bright)]"
		>
			{children}
		</Link>
	);
}

/** Label / value row ("Pick-up ........ Tue 10 Nov"). */
export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-6 py-3 text-sm">
			<dt className="eyebrow shrink-0">{label}</dt>
			<dd className="text-right text-[var(--color-ink)]">{children}</dd>
		</div>
	);
}

export function SkeletonBlock({ className }: { className?: string }) {
	return <div className={clsx('animate-pulse bg-[var(--color-surface)]', className)} />;
}

/** Empty state with an optional call to action. */
export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
	return (
		<div className="border border-dashed border-[var(--color-line-strong)] px-6 py-14 text-center">
			<p className="text-sm text-[var(--color-ink-muted)]">{message}</p>
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	);
}

export function Pagination({
	page,
	pageCount,
	onChange,
}: {
	page: number;
	pageCount: number;
	onChange: (page: number) => void;
}) {
	if (pageCount <= 1) return null;
	const btn =
		'h-9 border border-[var(--color-line-strong)] px-4 text-[0.64rem] uppercase tracking-[0.22em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] disabled:opacity-30 disabled:hover:border-[var(--color-line-strong)]';
	return (
		<div className="mt-8 flex items-center justify-center gap-4">
			<button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1} className={btn}>
				Previous
			</button>
			<span className="tabular text-xs text-[var(--color-ink-muted)]">
				{String(page).padStart(2, '0')} / {String(pageCount).padStart(2, '0')}
			</span>
			<button
				type="button"
				onClick={() => onChange(Math.min(pageCount, page + 1))}
				disabled={page >= pageCount}
				className={btn}
			>
				Next
			</button>
		</div>
	);
}
