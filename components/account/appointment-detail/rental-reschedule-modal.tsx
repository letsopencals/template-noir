'use client';

import { useMemo, useState } from 'react';
import moment from 'moment-timezone';
import type { AppointmentDetailResponse } from '@opencals/storefront-sdk';
import { useCarRanges } from '@/hooks/use-car-ranges';
import { addDays, fitsDates, todayIn, toAppointmentSlot, type AvailabilityRange } from '@/lib/rental';
import { siteConfig } from '@/lib/site-config';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/auth/auth-feedback';
import { dayLabel, formatLocalDate } from '@/components/account/booking-meta';
import { Modal, chipClass, readError } from './modal';

const DAYS_AHEAD = 60;
const TZ = siteConfig.timezone;

/** The appointment's own [from, to] as a UTC range, so it counts as free when moving it. */
function ownRange(from: string, to: string): AvailabilityRange {
	const a = moment.utc(from);
	const b = moment.utc(to);
	return {
		fromDate: a.format('YYYY-MM-DD'),
		fromTime: a.format('HH:mm:ss'),
		toDate: b.format('YYYY-MM-DD'),
		toTime: b.format('HH:mm:ss'),
	};
}

/**
 * Moves a day rental to a new pick-up date while keeping the same number of
 * days, location and delivery address. Availability comes from the car's
 * merged ranges; the booking's own interval is unioned back in client-side
 * (the ranges endpoint has no `excludeAppointmentId`), and the backend
 * re-validates on submit, excluding the booking itself.
 */
export function RentalRescheduleModal({
	appointment,
	pickUpDate,
	days,
	onClose,
	onRescheduled,
}: {
	appointment: AppointmentDetailResponse;
	pickUpDate: string;
	days: number;
	onClose: () => void;
	onRescheduled: () => void;
}) {
	const slug = appointment.product?.slug ?? null;
	// Each car is its own product pool, so its ranges already cover every location.
	const { ranges, isLoading, error: rangesError } = useCarRanges(slug);
	const [selected, setSelected] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	const candidates = useMemo(() => {
		const all = [...ranges, ownRange(appointment.from, appointment.to)];
		const start = addDays(todayIn(TZ), 1);
		return Array.from({ length: DAYS_AHEAD }, (_, i) => {
			const date = addDays(start, i);
			return { date, free: date !== pickUpDate && fitsDates(all, date, addDays(date, days), TZ) };
		});
	}, [ranges, appointment.from, appointment.to, pickUpDate, days]);

	async function handleReschedule() {
		if (!selected) return;
		setSubmitting(true);
		setError('');
		try {
			const res = await fetch(`/api/account/appointments/${appointment.id}/reschedule`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					slot: {
						productId: appointment.productId,
						...toAppointmentSlot(selected, addDays(selected, days), TZ),
						staffMemberId: null,
						locationId: appointment.locationId ?? null,
					},
				}),
			});
			if (res.ok) {
				onRescheduled();
			} else {
				setError(await readError(res, 'Those dates are no longer available. Please choose others.'));
			}
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Modal eyebrow="Change dates" title="New pick-up date" onClose={onClose} wide>
			<p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-muted)]">
				Your {appointment.product?.title ?? 'rental'} stays booked for{' '}
				<span className="tabular text-[var(--color-ink)]">{dayLabel(days)}</span>. Pick a new start date; the return
				date moves with it. To change the length of the rental, contact the concierge.
			</p>

			<div className="mt-7">
				<p className="eyebrow mb-3">Pick-up date</p>
				{isLoading ? (
					<div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
						{Array.from({ length: 14 }, (_, i) => (
							<div key={i} className="h-14 animate-pulse bg-[var(--color-surface)]" />
						))}
					</div>
				) : rangesError ? (
					<Notice tone="error">We couldn&apos;t load availability for this car.</Notice>
				) : (
					<div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
						{candidates.map(({ date, free }) => (
							<button
								key={date}
								type="button"
								disabled={!free}
								onClick={() => setSelected(date)}
								aria-pressed={selected === date}
								aria-label={formatLocalDate(date, 'dddd D MMMM')}
								className={`flex h-14 flex-col items-center justify-center transition-colors ${chipClass(selected === date, !free)}`}
							>
								<span className="text-[0.58rem] uppercase tracking-[0.2em] opacity-70">
									{formatLocalDate(date, 'ddd')}
								</span>
								<span className="tabular text-sm">{formatLocalDate(date, 'D MMM')}</span>
							</button>
						))}
					</div>
				)}
			</div>

			{selected ? (
				<dl className="mt-7 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
					<div className="flex justify-between gap-4 py-3 text-sm">
						<dt className="eyebrow">Current</dt>
						<dd className="tabular text-right text-[var(--color-ink-muted)]">
							{formatLocalDate(pickUpDate, 'ddd D MMM')} → {formatLocalDate(addDays(pickUpDate, days), 'ddd D MMM')}
						</dd>
					</div>
					<div className="flex justify-between gap-4 py-3 text-sm">
						<dt className="eyebrow">New</dt>
						<dd className="tabular text-right text-[var(--color-primary)]">
							{formatLocalDate(selected, 'ddd D MMM')} → {formatLocalDate(addDays(selected, days), 'ddd D MMM')}
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
				<Button onClick={handleReschedule} disabled={!selected || submitting} className="flex-1">
					{submitting ? 'Moving…' : 'Confirm new dates'}
				</Button>
			</div>
		</Modal>
	);
}
