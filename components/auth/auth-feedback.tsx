import { clsx } from 'clsx';

/** Hairline message strip for auth and account forms. */
export function Notice({
	tone = 'error',
	children,
	className,
}: {
	tone?: 'error' | 'success' | 'info';
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			role={tone === 'error' ? 'alert' : 'status'}
			className={clsx(
				'flex items-start gap-3 rounded-[2px] border px-4 py-3 text-sm leading-relaxed',
				tone === 'error' && 'border-red-400/30 bg-red-500/[0.06] text-red-200',
				tone === 'success' && 'border-[var(--color-primary)]/40 bg-[var(--color-tint)] text-[var(--color-ink)]',
				tone === 'info' && 'border-[var(--color-line-strong)] bg-[var(--color-surface)] text-[var(--color-ink-muted)]',
				className,
			)}
		>
			<span
				aria-hidden
				className={clsx(
					'mt-[0.45rem] h-1.5 w-1.5 shrink-0',
					tone === 'error' && 'bg-red-400',
					tone === 'success' && 'bg-[var(--color-primary)]',
					tone === 'info' && 'bg-[var(--color-ink-dim)]',
				)}
			/>
			<div>{children}</div>
		</div>
	);
}

/** Thin champagne ring spinner. */
export function Spinner({ className }: { className?: string }) {
	return (
		<span
			aria-hidden
			className={clsx(
				'inline-block h-8 w-8 animate-spin rounded-full border border-[var(--color-line-strong)] border-t-[var(--color-primary)]',
				className,
			)}
		/>
	);
}

/** Full-screen loading fallback for Suspense boundaries on auth pages. */
export function AuthFallback() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
			<Spinner />
		</div>
	);
}

/** Small uppercase field label matching the NOIR eyebrow style. */
export const FIELD_LABEL = 'eyebrow mb-2.5 block';
/** Class to pass to `FormLabel` so it matches `FIELD_LABEL` (overrides its default colour). */
export const FORM_LABEL = 'eyebrow mb-0 block text-[var(--color-ink-muted)]';
