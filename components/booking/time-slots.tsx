'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import type { CurrentAvailabilitySlot, ProductListVariantStaffMember } from '@opencals/storefront-sdk';

interface TimeSlotsProps {
	slots: CurrentAvailabilitySlot[];
	selectedSlot: CurrentAvailabilitySlot | null;
	onSlotSelect: (slot: CurrentAvailabilitySlot) => void;
	loading: boolean;
	timezone: string;
	staffMembers?: ProductListVariantStaffMember[];
}

type Bucket = 'morning' | 'afternoon' | 'evening';
const BUCKETS: Bucket[] = ['morning', 'afternoon', 'evening'];
const BUCKET_LABELS: Record<Bucket, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
const SKELETON = Array.from({ length: 12 }, (_, i) => i);

function formatSlotTime(date: string, time: string, timezone: string): string {
	return new Date(`${date}T${time}Z`).toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false });
}

function localHour(date: string, time: string, timezone: string): number {
	const h = parseInt(new Date(`${date}T${time}Z`).toLocaleTimeString('en-GB', { timeZone: timezone, hour12: false, hour: '2-digit' }), 10);
	return Number.isNaN(h) ? 0 : h;
}

function bucketFor(hour: number): Bucket {
	return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}

/** Start times grouped by part of day, 24-hour Dubai time in Geist Mono. */
export function TimeSlots({ slots, selectedSlot, onSlotSelect, loading, timezone, staffMembers = [] }: TimeSlotsProps) {
	const grouped = useMemo(() => {
		const groups: Record<Bucket, CurrentAvailabilitySlot[]> = { morning: [], afternoon: [], evening: [] };
		for (const slot of slots) groups[bucketFor(localHour(slot.fromDate, slot.fromTime, timezone))].push(slot);
		return groups;
	}, [slots, timezone]);

	if (loading) {
		return (
			<div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-6" aria-busy>
				{SKELETON.map((i) => (
					<div key={i} className="h-12 animate-pulse bg-[var(--color-surface-2)]" />
				))}
			</div>
		);
	}

	if (slots.length === 0) {
		return (
			<div className="border border-dashed border-[var(--color-line-strong)] px-5 py-10 text-center">
				<p className="text-sm text-[var(--color-ink-muted)]">No times free on this day.</p>
				<p className="mt-1 text-xs text-[var(--color-ink-dim)]">Try another day, or message the concierge.</p>
			</div>
		);
	}

	return (
		<div className="space-y-7">
			{BUCKETS.map((bucket) => {
				const items = grouped[bucket];
				if (items.length === 0) return null;
				return (
					<section key={bucket}>
						<p className="mb-3 text-[0.62rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]">
							{BUCKET_LABELS[bucket]} <span className="tabular">· {items.length}</span>
						</p>
						<div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-6">
							{items.map((slot) => {
								const isSelected = selectedSlot?.fromDate === slot.fromDate && selectedSlot?.fromTime === slot.fromTime;
								const isFull = slot.attendees >= slot.maxAttendees;
								const slotStaff = staffMembers.filter((s) => slot.staffMemberIds?.includes(s.id));
								const first = slotStaff[0];
								return (
									<button
										key={`${slot.fromDate}-${slot.fromTime}`}
										type="button"
										onClick={() => (isFull ? undefined : onSlotSelect(slot))}
										disabled={isFull}
										aria-pressed={isSelected}
										className={clsx(
											'flex flex-col items-center justify-center border px-2 py-2.5 transition-colors duration-300',
											isFull
												? 'cursor-not-allowed border-[var(--color-line)] opacity-35'
												: isSelected
													? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-black'
													: 'border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary-dark)]',
										)}
									>
										<span className="tabular text-sm leading-none">{formatSlotTime(slot.fromDate, slot.fromTime, timezone)}</span>
										{first?.firstName ? (
											<span className={clsx('mt-1 text-[0.55rem] uppercase tracking-[0.16em]', isSelected ? 'text-black/65' : 'text-[var(--color-ink-dim)]')}>
												{first.firstName}
												{slotStaff.length > 1 ? ` +${slotStaff.length - 1}` : ''}
											</span>
										) : null}
									</button>
								);
							})}
						</div>
					</section>
				);
			})}
		</div>
	);
}
