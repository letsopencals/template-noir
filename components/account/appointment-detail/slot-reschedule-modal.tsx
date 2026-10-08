'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppointmentDetailResponse, CurrentAvailabilitySlot } from '@opencals/storefront-sdk';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { addDays, todayIn } from '@/lib/rental';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/auth/auth-feedback';
import { Modal, chipClass, readError } from './modal';

const DAYS_AHEAD = 30;

/**
 * Classic slot reschedule for clock-time bookings (chauffeur packages and
 * anything else that isn't a day rental). Same driver, same location.
 */
export function SlotRescheduleModal({
	appointment,
	onClose,
	onRescheduled,
}: {
	appointment: AppointmentDetailResponse;
	onClose: () => void;
	onRescheduled: () => void;
}) {
	const [selectedDate, setSelectedDate] = useState('');
	const [slots, setSlots] = useState<CurrentAvailabilitySlot[]>([]);
	const [selectedSlot, setSelectedSlot] = useState<CurrentAvailabilitySlot | null>(null);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	const { formatCustom, formatSlot, formatTime, timezone } = useDateFormatter();
	const productId = appointment.productId;

	const dates = useMemo(() => {
		const today = todayIn(timezone);
		return Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));
	}, [timezone]);

	const fetchSlots = useCallback(
		async (date: string) => {
			setLoadingSlots(true);
			setSlots([]);
			setSelectedSlot(null);
			try {
				const params = new URLSearchParams({ productId, date, timezone });
				if (appointment.staffMemberId) params.set('staffMemberId', appointment.staffMemberId);
				if (appointment.locationId) params.set('locationId', appointment.locationId);

				const res = await fetch(`/api/availability?${params}`);
				if (res.ok) {
					const data = await res.json();
					const availableSlots: CurrentAvailabilitySlot[] = Array.isArray(data) ? data : (data?.slots ?? []);
					setSlots(availableSlots);
				}
			} catch {
				// silently fail
			} finally {
				setLoadingSlots(false);
			}
		},
		[productId, timezone, appointment.staffMemberId, appointment.locationId],
	);

	useEffect(() => {
		if (selectedDate) fetchSlots(selectedDate);
	}, [selectedDate, fetchSlots]);

	async function handleReschedule() {
		if (!selectedSlot) return;
		setSubmitting(true);
		setError('');
		try {
			const res = await fetch(`/api/account/appointments/${appointment.id}/reschedule`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					slot: {
						productId,
						fromDate: selectedSlot.fromDate,
						fromTime: selectedSlot.fromTime,
						toDate: selectedSlot.toDate,
						toTime: selectedSlot.toTime,
						staffMemberId: selectedSlot.staffMemberIds?.[0] ?? appointment.staffMemberId ?? null,
						locationId: selectedSlot.locationIds?.[0] ?? appointment.locationId ?? null,
					},
				}),
			});
			if (res.ok) {
				onRescheduled();
			} else {
				setError(await readError(res, 'We could not move this booking.'));
			}
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Modal eyebrow="Reschedule" title="Choose a new time" onClose={onClose} wide>
			<p className="mt-4 text-sm text-[var(--color-ink-muted)]">
				{appointment.product?.title ?? 'Your booking'}, with the same driver. Times are shown in {timezone.replace('_', ' ')}.
			</p>

			<div className="mt-7">
				<label htmlFor="reschedule-date" className="eyebrow mb-2.5 block">
					Date
				</label>
				<select
					id="reschedule-date"
					value={selectedDate}
					onChange={(e) => setSelectedDate(e.target.value)}
					className="h-12 w-full border border-[var(--color-line-strong)] bg-[var(--color-bg)] px-4 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none"
				>
					<option value="">Choose a date…</option>
					{dates.map((date) => (
						<option key={date} value={date}>
							{formatCustom(`${date}T12:00:00Z`, 'dddd D MMMM')}
						</option>
					))}
				</select>
			</div>

			{selectedDate ? (
				<div className="mt-7">
					<p className="eyebrow mb-3">Available times</p>
					{loadingSlots ? (
						<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
							{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
								<div key={i} className="h-10 animate-pulse bg-[var(--color-surface)]" />
							))}
						</div>
					) : slots.length === 0 ? (
						<p className="text-sm text-[var(--color-ink-muted)]">No available times on this date.</p>
					) : (
						<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
							{slots.map((slot) => (
								<button
									key={`${slot.fromDate}-${slot.fromTime}`}
									type="button"
									onClick={() => setSelectedSlot(slot)}
									aria-pressed={selectedSlot === slot}
									className={`tabular h-10 text-xs transition-colors ${chipClass(selectedSlot === slot)}`}
								>
									{formatSlot(slot.fromDate, slot.fromTime, 'time')}
								</button>
							))}
						</div>
					)}
				</div>
			) : null}

			{selectedSlot ? (
				<dl className="mt-7 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
					<div className="flex justify-between py-3 text-sm">
						<dt className="eyebrow">Current</dt>
						<dd className="tabular text-[var(--color-ink-muted)]">
							{formatCustom(appointment.from, 'ddd D MMM')} · {formatTime(appointment.from)}
						</dd>
					</div>
					<div className="flex justify-between py-3 text-sm">
						<dt className="eyebrow">New</dt>
						<dd className="tabular text-[var(--color-primary)]">
							{formatSlot(selectedSlot.fromDate, selectedSlot.fromTime, 'ddd D MMM')} ·{' '}
							{formatSlot(selectedSlot.fromDate, selectedSlot.fromTime, 'time')}
						</dd>
					</div>
				</dl>
			) : null}

			{error ? (
				<Notice tone="error" className="mt-5">
					{error}
				</Notice>
			) : null}

			<div className="mt-8 flex flex-col gap-3 sm:flex-row">
				<Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
					Back
				</Button>
				<Button onClick={handleReschedule} disabled={!selectedSlot || submitting} className="flex-1">
					{submitting ? 'Moving…' : 'Confirm new time'}
				</Button>
			</div>
		</Modal>
	);
}
