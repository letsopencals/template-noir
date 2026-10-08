'use client';

import type { AppointmentDetailResponse } from '@opencals/storefront-sdk';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { formatDuration } from '@/lib/format';
import { DetailRow, Panel } from '@/components/account/account-ui';
import type { BookingMeta } from '@/components/account/booking-meta';

/** Clock-time bookings: chauffeur packages (driver + preferred car) and anything else. */
export function SessionSummary({ appointment, meta }: { appointment: AppointmentDetailResponse; meta: BookingMeta }) {
	const { formatCustom, formatTime } = useDateFormatter();
	const seconds = Math.max(0, Math.round((new Date(appointment.to).getTime() - new Date(appointment.from).getTime()) / 1000));

	return (
		<Panel title={meta.kind === 'chauffeur' ? 'Your chauffeur' : 'Your booking'}>
			<div className="border-y border-[var(--color-line)] py-6">
				<p className="eyebrow">{formatCustom(appointment.from, 'dddd')}</p>
				<p className="heading-display mt-3 text-2xl text-[var(--color-ink)] sm:text-3xl">
					{formatCustom(appointment.from, 'D MMM YYYY')}
				</p>
				<p className="tabular mt-2 text-sm text-[var(--color-ink-muted)]">
					{formatTime(appointment.from)} – {formatTime(appointment.to)}
					{seconds > 0 ? ` · ${formatDuration(seconds)}` : ''}
				</p>
			</div>

			<dl className="mt-2 divide-y divide-[var(--color-line)]">
				{meta.driver ? <DetailRow label="Driver">{meta.driver}</DetailRow> : null}
				{meta.preferredCar ? <DetailRow label="Preferred car">{meta.preferredCar}</DetailRow> : null}
				{meta.locationTitle || meta.address ? (
					<DetailRow label={meta.isDelivery ? 'Pick-up address' : 'Location'}>
						{meta.isDelivery ? null : <span className="block">{meta.locationTitle}</span>}
						{meta.address ? (
							<span className={meta.isDelivery ? 'block' : 'mt-1 block text-[var(--color-ink-muted)]'}>{meta.address}</span>
						) : null}
					</DetailRow>
				) : null}
				{meta.flightNumber ? (
					<DetailRow label="Flight">
						<span className="tabular">{meta.flightNumber}</span>
					</DetailRow>
				) : null}
				{appointment.numberOfAttendees > 1 ? (
					<DetailRow label="Passengers">
						<span className="tabular">{appointment.numberOfAttendees}</span>
					</DetailRow>
				) : null}
			</dl>

			{meta.preferredCar ? (
				<p className="mt-5 text-xs leading-relaxed text-[var(--color-ink-dim)]">
					The preferred car is a request; we confirm the exact car with your driver before the booking.
				</p>
			) : null}
		</Panel>
	);
}
