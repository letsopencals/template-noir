'use client';

import { memo } from 'react';
import { formatPrice } from '@/lib/format';

interface DurationStepperProps {
	units: number;
	maxUnits: number;
	baseSeconds: number;
	unitPrice: number;
	currency: string | undefined;
	onChange: (units: number) => void;
}

const STEP_BTN =
	'flex h-11 w-11 items-center justify-center border border-[var(--color-line-strong)] text-lg text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-30';

function unitLabel(baseSeconds: number, n: number): string {
	if (baseSeconds % 3600 === 0) {
		const hours = (baseSeconds / 3600) * n;
		return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
	}
	const minutes = Math.round((baseSeconds / 60) * n);
	return `${minutes} min`;
}

/** "By the hour" length picker: − / + over whole base units, price × units. */
export const DurationStepper = memo(function DurationStepper({ units, maxUnits, baseSeconds, unitPrice, currency, onChange }: DurationStepperProps) {
	return (
		<div className="border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-5 py-5">
			<div className="flex flex-wrap items-center justify-between gap-5">
				<div>
					<p className="text-[0.62rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]">How long</p>
					<p className="tabular mt-1.5 text-xl text-[var(--color-ink)]" aria-live="polite">
						{unitLabel(baseSeconds, units)}
					</p>
				</div>
				<div className="flex items-center gap-1.5" role="group" aria-label="Booking length">
					<button type="button" className={STEP_BTN} onClick={() => onChange(units - 1)} disabled={units <= 1} aria-label="Shorter">
						−
					</button>
					<span className="tabular w-10 text-center text-sm text-[var(--color-ink-muted)]">{units}</span>
					<button type="button" className={STEP_BTN} onClick={() => onChange(units + 1)} disabled={units >= maxUnits} aria-label="Longer">
						+
					</button>
				</div>
			</div>
			<p className="tabular mt-4 border-t border-[var(--color-line)] pt-3 text-xs text-[var(--color-ink-muted)]">
				{formatPrice(unitPrice, currency)} × {units} = <span className="text-[var(--color-primary)]">{formatPrice(unitPrice * units, currency)}</span>
				<span className="text-[var(--color-ink-dim)]"> · up to {unitLabel(baseSeconds, maxUnits)}</span>
			</p>
		</div>
	);
});
