'use client';

import { memo } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import type { AppointmentListItemResponse } from '@opencals/storefront-sdk';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { formatDuration } from '@/lib/format';
import { StatusBadge } from './status-badge';
import { dayLabel, formatLocalDate, getBookingMeta } from './booking-meta';

export interface AppointmentRowProps {
	appointment: Pick<
		AppointmentListItemResponse,
		| 'id'
		| 'from'
		| 'to'
		| 'status'
		| 'numberOfAttendees'
		| 'staffMemberId'
		| 'staffMember'
		| 'customAttributes'
		| 'product'
		| 'location'
		| 'addressLine1'
		| 'addressLine2'
		| 'city'
		| 'state'
		| 'postalCode'
		| 'country'
		| 'displayAddress'
	>;
	/** Tighter row for the overview page. */
	compact?: boolean;
}

/**
 * One booking in a list. Rentals read "Tue 10 Nov → Fri 13 Nov · 3 days ·
 * Delivery"; chauffeur bookings show the clock time and driver.
 */
export const AppointmentRow = memo(function AppointmentRow({ appointment: appt, compact }: AppointmentRowProps) {
	const { formatCustom, formatTime } = useDateFormatter();
	const meta = getBookingMeta(appt);
	const rental = meta.kind === 'rental';

	const lengthSeconds = Math.round((Date.parse(appt.to) - Date.parse(appt.from)) / 1000);

	return (
		<Link
			href={`/account/appointments/${appt.id}`}
			className={clsx(
				'group grid grid-cols-[auto_1fr_auto] items-center gap-5 transition-colors hover:bg-[var(--color-surface-2)]',
				compact ? 'px-0 py-4' : 'px-5 py-5 sm:px-6',
			)}
		>
			{/* Date plate */}
			<div className="flex w-14 flex-col items-center border border-[var(--color-line-strong)] py-2">
				<span className="text-[0.56rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)]">
					{rental ? formatLocalDate(meta.pickUpDate, 'MMM') : formatCustom(appt.from, 'MMM')}
				</span>
				<span className="tabular mt-0.5 text-xl text-[var(--color-ink)]">
					{rental ? formatLocalDate(meta.pickUpDate, 'DD') : formatCustom(appt.from, 'DD')}
				</span>
			</div>

			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
					<p className="truncate font-display text-sm font-semibold uppercase tracking-[0.06em] [font-stretch:115%] text-[var(--color-ink)]">
						{meta.title}
					</p>
					<span className="text-[0.6rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]">
						{rental ? 'Rental' : meta.kind === 'chauffeur' ? 'Chauffeur' : null}
					</span>
				</div>
				<p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-ink-muted)]">
					{rental ? (
						<>
							<span className="tabular">
								{formatLocalDate(meta.pickUpDate, 'ddd D MMM')} → {formatLocalDate(meta.returnDate, 'ddd D MMM')}
							</span>
							<span className="tabular text-[var(--color-ink)]">{dayLabel(meta.days)}</span>
							{meta.handoverTime ? <span className="tabular">Handover {meta.handoverTime}</span> : null}
						</>
					) : (
						<>
							<span className="tabular">
								{formatCustom(appt.from, 'ddd D MMM')} · {formatTime(appt.from)}
							</span>
							{lengthSeconds > 0 ? <span className="tabular">{formatDuration(lengthSeconds)}</span> : null}
							{meta.driver ? <span>with {meta.driver}</span> : null}
						</>
					)}
					{!compact && (meta.isDelivery || meta.locationTitle) ? (
						<span>{meta.isDelivery ? 'Delivery' : meta.locationTitle}</span>
					) : null}
				</p>
			</div>

			<div className="flex flex-col items-end gap-2">
				<StatusBadge kind="appointment" status={appt.status} />
				<span
					aria-hidden
					className="text-[var(--color-ink-dim)] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--color-primary)]"
				>
					→
				</span>
			</div>
		</Link>
	);
});
