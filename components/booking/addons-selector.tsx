'use client';

import { clsx } from 'clsx';
import type { AddOnListItemResponse } from '@opencals/storefront-sdk';
import { formatPrice } from '@/lib/format';

interface AddOnsSelectorProps {
	addOns: AddOnListItemResponse[];
	loading: boolean;
	selected: Map<string, number>;
	bookedDurationUnits: number;
	currency?: string;
	onChange: (addOnId: string, quantity: number) => void;
	/** Word for one base unit in the "× N" hint. Default "day". */
	unitLabel?: string;
	title?: string;
	subtitle?: string;
	/** Drop the panel chrome when the parent section already provides it. */
	bare?: boolean;
}

const SKELETON_ROWS = [0, 1, 2] as const;

/**
 * Optional extras as a quiet spec list. Per-unit extras (`durationMultiplied`)
 * show the line total (price × days) and toggle on/off; the rest have a
 * quantity stepper up to `maxQuantity`.
 */
export function AddOnsSelector({
	addOns,
	loading,
	selected,
	bookedDurationUnits,
	currency,
	onChange,
	unitLabel = 'day',
	title = 'Extras',
	subtitle = 'Optional. Skip to continue without any.',
	bare = false,
}: AddOnsSelectorProps) {
	const body = loading ? (
		<div className="space-y-px">
			{SKELETON_ROWS.map((i) => (
				<div key={i} className="h-[4.5rem] animate-pulse bg-[var(--color-surface-2)]" />
			))}
		</div>
	) : addOns.length === 0 ? (
		<p className="border border-dashed border-[var(--color-line)] px-5 py-8 text-center text-sm text-[var(--color-ink-muted)]">
			No extras for this booking. Continue below.
		</p>
	) : (
		<ul className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
			{addOns.map((addOn) => (
				<AddOnRow
					key={addOn.id}
					addOn={addOn}
					qty={selected.get(addOn.id) ?? 0}
					units={bookedDurationUnits}
					unitLabel={unitLabel}
					currency={currency}
					onChange={onChange}
				/>
			))}
		</ul>
	);

	if (bare) return body;

	return (
		<div className="border border-[var(--color-line)] bg-[var(--color-surface)]">
			<div className="border-b border-[var(--color-line)] px-5 py-5 sm:px-7">
				<p className="heading-display text-sm tracking-[0.08em] text-[var(--color-ink)]">{title}</p>
				<p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">{subtitle}</p>
			</div>
			<div className="px-5 py-5 sm:px-7">{body}</div>
		</div>
	);
}

interface AddOnRowProps {
	addOn: AddOnListItemResponse;
	qty: number;
	units: number;
	unitLabel: string;
	currency?: string;
	onChange: (addOnId: string, quantity: number) => void;
}

function AddOnRow({ addOn, qty, units, unitLabel, currency, onChange }: AddOnRowProps) {
	const isSelected = qty > 0;
	const perUnit = addOn.durationMultiplied;
	const lineTotal = (perUnit ? addOn.price * units : addOn.price) * Math.max(qty, 1);
	const atMax = !perUnit && addOn.maxQuantity != null && qty >= addOn.maxQuantity;

	return (
		<li
			className={clsx(
				'flex items-start justify-between gap-4 py-4 pl-4 pr-1 transition-colors duration-300',
				isSelected ? 'bg-[var(--color-tint)] shadow-[inset_2px_0_0_var(--color-primary)]' : '',
			)}
		>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium text-[var(--color-ink)]">{addOn.title ?? addOn.slug}</p>
				{addOn.description ? (
					<p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">{addOn.description}</p>
				) : null}
				<p className="tabular mt-2 text-xs">
					<span className="text-[var(--color-primary)]">{formatPrice(lineTotal, currency)}</span>
					{perUnit ? (
						<span className="ml-2 text-[var(--color-ink-dim)]">
							{formatPrice(addOn.price, currency)} × {units} {units === 1 ? unitLabel : `${unitLabel}s`}
						</span>
					) : null}
				</p>
			</div>

			<div className="flex shrink-0 items-center gap-1 pt-0.5">
				{perUnit || (addOn.maxQuantity != null && addOn.maxQuantity <= 1) ? (
					<button
						type="button"
						aria-pressed={isSelected}
						onClick={() => onChange(addOn.id, isSelected ? 0 : 1)}
						className={clsx(
							'h-9 min-w-[5.5rem] border px-4 text-[0.64rem] uppercase tracking-[0.22em] transition-colors',
							isSelected
								? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-black'
								: 'border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary)]',
						)}
					>
						{isSelected ? 'Added' : 'Add'}
					</button>
				) : isSelected ? (
					<>
						<StepperButton label="Decrease quantity" onClick={() => onChange(addOn.id, qty - 1)} path="M4 8h8" />
						<span className="tabular w-8 text-center text-sm text-[var(--color-ink)]" aria-live="polite">
							{qty}
						</span>
						<StepperButton label="Increase quantity" disabled={atMax} onClick={() => onChange(addOn.id, qty + 1)} path="M8 4v8M4 8h8" />
					</>
				) : (
					<button
						type="button"
						onClick={() => onChange(addOn.id, 1)}
						className="h-9 min-w-[5.5rem] border border-[var(--color-line-strong)] px-4 text-[0.64rem] uppercase tracking-[0.22em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)]"
					>
						Add
					</button>
				)}
			</div>
		</li>
	);
}

function StepperButton({ label, onClick, disabled, path }: { label: string; onClick: () => void; disabled?: boolean; path: string }) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			className="flex h-9 w-9 items-center justify-center border border-[var(--color-line-strong)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-30"
		>
			<svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
				<path d={path} strokeLinecap="square" />
			</svg>
		</button>
	);
}
