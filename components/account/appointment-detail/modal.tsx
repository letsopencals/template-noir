'use client';

import { useEffect, useId } from 'react';

/**
 * Centered dialog over a black scrim. Sits above the header (z-60) and below
 * the page-transition curtain (z-70 is only shown during navigation, so z-75
 * keeps the dialog on top). `data-lenis-prevent` lets the panel scroll natively
 * while Lenis owns the page.
 */
export function Modal({
	title,
	eyebrow,
	onClose,
	children,
	wide,
}: {
	title: string;
	eyebrow?: string;
	onClose: () => void;
	children: React.ReactNode;
	wide?: boolean;
}) {
	const titleId = useId();

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-[75] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				data-lenis-prevent
				className={`max-h-[90vh] w-full overflow-y-auto border border-[var(--color-line-strong)] bg-[var(--color-bg)] p-7 card-shadow-lg sm:p-9 ${wide ? 'max-w-2xl' : 'max-w-md'}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start justify-between gap-6">
					<div>
						{eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
						<h3 id={titleId} className="heading-display text-xl text-[var(--color-ink)] sm:text-2xl">
							{title}
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="-mr-2 -mt-1 p-2 text-[var(--color-ink-dim)] transition-colors hover:text-[var(--color-ink)]"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}

/** Squared destructive button (Button has no destructive variant by design). */
export const DESTRUCTIVE_BUTTON =
	'inline-flex h-11 items-center justify-center gap-2 border border-red-400/40 px-6 text-[0.7rem] font-medium uppercase tracking-[0.24em] text-red-300 transition-colors hover:border-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40';

/** Selectable chip (date / time pickers inside the modals). */
export function chipClass(selected: boolean, disabled = false): string {
	if (disabled) {
		return 'border border-[var(--color-line)] text-[var(--color-ink-dim)] line-through decoration-[var(--color-ink-dim)] cursor-not-allowed';
	}
	return selected
		? 'border border-[var(--color-primary)] bg-[var(--color-primary)] text-black'
		: 'border border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary)]';
}

/** Reads `{ error }` from a failed template API response. */
export async function readError(res: Response, fallback: string): Promise<string> {
	try {
		const data = await res.json();
		return typeof data?.error === 'string' ? data.error : typeof data?.message === 'string' ? data.message : fallback;
	} catch {
		return fallback;
	}
}
