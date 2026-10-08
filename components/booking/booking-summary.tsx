'use client';

import type {
	AddOnListItemResponse,
	CurrentAvailabilitySlot,
	ProductListItemResponse,
	ProductListVariant,
	ProductListVariantLocation,
	ProductListVariantStaffMember,
} from '@opencals/storefront-sdk';
import { computeAddOnLineTotal, formatDuration, formatPrice } from '@/lib/format';
import type { BookingStep } from '@/lib/booking-constants';
import { siteConfig } from '@/lib/site-config';

interface BookingSummaryProps {
	product: ProductListItemResponse;
	activeVariant: ProductListVariant | null;
	variantLabel: string | null;
	staff: ProductListVariantStaffMember | null;
	location: ProductListVariantLocation | null;
	selectedSlot: CurrentAvailabilitySlot;
	selectedDate: string | null;
	availableAddOns: AddOnListItemResponse[];
	selectedAddOns: Map<string, number>;
	bookedDurationUnits: number;
	currency: string | undefined;
	attendees: number;
	whoSkipped?: boolean;
	formatCustom: (iso: string, fmt: string) => string;
	formatTimeRange: (fromDate: string, fromTime: string, toDate: string, toTime: string) => [string, string];
	onEdit?: (step: BookingStep) => void;
	/** Seconds actually booked (custom-duration packages). Falls back to the variant duration. */
	bookedSeconds?: number | null;
	/** Preferred car title, if one was picked. */
	preferredCar?: string | null;
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
	return (
		<div className="flex items-start justify-between gap-4 border-b border-[var(--color-line)] py-3 last:border-b-0">
			<div className="min-w-0">
				<p className="text-[0.6rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]">{label}</p>
				<p className="mt-1 text-sm text-[var(--color-ink)]">{value}</p>
			</div>
			{onEdit ? (
				<button
					type="button"
					onClick={onEdit}
					aria-label={`Change ${label.toLowerCase()}`}
					className="link-underline shrink-0 text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-primary)]"
				>
					Change
				</button>
			) : null}
		</div>
	);
}

function locationLabel(location: ProductListVariantLocation): string {
	if (location.type === siteConfig.locationTypes.delivery) return 'Pick-up from your address';
	if (location.type === siteConfig.locationTypes.garage) return `Garage · ${siteConfig.contact.addressShort}`;
	return location.title ?? 'Location';
}

export function BookingSummary({
	product,
	activeVariant,
	variantLabel,
	staff,
	location,
	selectedSlot,
	selectedDate,
	availableAddOns,
	selectedAddOns,
	bookedDurationUnits,
	currency,
	attendees,
	whoSkipped,
	formatCustom,
	formatTimeRange,
	onEdit,
	bookedSeconds,
	preferredCar,
}: BookingSummaryProps) {
	const [start, end] = formatTimeRange(selectedSlot.fromDate, selectedSlot.fromTime, selectedSlot.toDate, selectedSlot.toTime);
	const dateStr = selectedDate ? formatCustom(`${selectedDate}T00:00:00`, 'dddd, D MMM') : '';
	const duration = formatDuration(bookedSeconds ?? activeVariant?.duration ?? product.duration);
	const editWhen = onEdit ? () => onEdit('when') : undefined;
	const staffName = staff ? [staff.firstName, staff.lastName].filter(Boolean).join(' ') || 'Chauffeur' : null;

	return (
		<div className="border border-[var(--color-line-strong)] bg-[var(--color-surface)]">
			<div className="border-b border-[var(--color-line)] px-5 py-4">
				<p className="eyebrow">Your journey</p>
			</div>
			<div className="px-5 py-2">
				<Row label="Package" value={variantLabel ? `${product.title} · ${variantLabel}` : (product.title ?? 'Chauffeur')} />
				{location ? <Row label="Pick-up" value={locationLabel(location)} /> : null}
				<Row label="Date" value={dateStr} onEdit={editWhen} />
				<Row label="Time · Dubai" value={`${start} – ${end}`} onEdit={editWhen} />
				<Row label="Duration" value={duration} />
				{staffName ? <Row label="Chauffeur" value={staffName} onEdit={onEdit ? () => onEdit(whoSkipped ? 'when' : 'who') : undefined} /> : null}
				{preferredCar ? <Row label="Preferred car" value={`${preferredCar} · on request`} /> : null}
				{attendees > 1 ? <Row label="Passengers" value={String(attendees)} /> : null}

				{selectedAddOns.size > 0 ? (
					<div className="space-y-1.5 py-3">
						<p className="text-[0.6rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]">Extras</p>
						{Array.from(selectedAddOns.entries()).map(([addOnId, qty]) => {
							const addOn = availableAddOns.find((a) => a.id === addOnId);
							if (!addOn) return null;
							const lineTotal = computeAddOnLineTotal(addOn, qty, bookedDurationUnits);
							return (
								<div key={addOnId} className="flex justify-between gap-4 text-xs">
									<span className="text-[var(--color-ink-muted)]">
										{addOn.title ?? addOn.slug}
										{!addOn.durationMultiplied && qty > 1 ? ` × ${qty}` : ''}
									</span>
									<span className="tabular text-[var(--color-ink)]">{formatPrice(lineTotal, currency)}</span>
								</div>
							);
						})}
					</div>
				) : null}
			</div>
		</div>
	);
}
