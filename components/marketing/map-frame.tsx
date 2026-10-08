import { clsx } from 'clsx';

/** Hairline frame with champagne corner ticks for the stylised maps. */
export function MapFrame({ children, className, caption }: { children: React.ReactNode; className?: string; caption?: string }) {
	return (
		<figure className={clsx('relative border border-[var(--color-line)] bg-[var(--color-bg-deep)] p-2 sm:p-4', className)}>
			<span aria-hidden className="absolute -left-px -top-px h-3 w-3 border-l border-t border-[var(--color-primary)]" />
			<span aria-hidden className="absolute -right-px -top-px h-3 w-3 border-r border-t border-[var(--color-primary)]" />
			<span aria-hidden className="absolute -bottom-px -left-px h-3 w-3 border-b border-l border-[var(--color-primary)]" />
			<span aria-hidden className="absolute -bottom-px -right-px h-3 w-3 border-b border-r border-[var(--color-primary)]" />
			{children}
			{caption ? <figcaption className="eyebrow mt-3 px-1 !text-[0.58rem]">{caption}</figcaption> : null}
		</figure>
	);
}
