'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { AnimatedNumber } from '@/components/rental/book/animated-number';
import { formatPrice } from '@/lib/format';

interface BookingBarProps {
	title: string;
	total: number;
	currency: string;
}

/** Sticky hairline bar under the site header: back to packages, title, live total. */
export const BookingBar = memo(function BookingBar({ title, total, currency }: BookingBarProps) {
	const format = useCallback((n: number) => formatPrice(n, currency), [currency]);
	return (
		<div className="sticky top-[72px] z-20 border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur-md">
			<div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3.5 lg:px-10">
				<Link
					href="/chauffeur"
					className="inline-flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-primary)]"
				>
					<span aria-hidden>←</span>
					<span className="hidden sm:inline">All packages</span>
				</Link>
				<p className="heading-display truncate text-center text-xs tracking-[0.1em] text-[var(--color-ink)]">{title}</p>
				<AnimatedNumber value={total} format={format} className="tabular text-sm text-[var(--color-primary)]" />
			</div>
		</div>
	);
});
