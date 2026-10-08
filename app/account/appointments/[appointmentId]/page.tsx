'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AppointmentDetailResponse } from '@opencals/storefront-sdk';
import { buttonClasses } from '@/components/ui/button';
import { AccountHeading, SkeletonBlock } from '@/components/account/account-ui';
import { StatusBadge } from '@/components/account/status-badge';
import { getBookingMeta } from '@/components/account/booking-meta';
import { RentalSummary } from '@/components/account/appointment-detail/rental-summary';
import { SessionSummary } from '@/components/account/appointment-detail/session-summary';
import { AddOnsPanel } from '@/components/account/appointment-detail/add-ons-panel';
import { ActionsPanel } from '@/components/account/appointment-detail/actions-panel';
import { BookingAside } from '@/components/account/appointment-detail/booking-aside';
import { CancelModal } from '@/components/account/appointment-detail/cancel-modal';
import { SlotRescheduleModal } from '@/components/account/appointment-detail/slot-reschedule-modal';
import { RentalRescheduleModal } from '@/components/account/appointment-detail/rental-reschedule-modal';
import { getChangePolicy } from '@/components/account/appointment-detail/policy';

type ModalState = 'none' | 'cancel' | 'reschedule';

export default function AppointmentDetailPage() {
	const { appointmentId } = useParams<{ appointmentId: string }>();
	const router = useRouter();
	const [appointment, setAppointment] = useState<AppointmentDetailResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [modal, setModal] = useState<ModalState>('none');
	const actionHandledRef = useRef(false);

	const fetchAppointment = useCallback(async () => {
		try {
			const res = await fetch(`/api/account/appointments/${appointmentId}`);
			if (res.ok) setAppointment(await res.json());
		} catch {
			// silently fail
		} finally {
			setLoading(false);
		}
	}, [appointmentId]);

	useEffect(() => {
		fetchAppointment();
	}, [fetchAppointment]);

	// Auto-open the cancel/reschedule modal when arriving from an emailed link
	// (backend links carry `?action=cancel|reschedule`, see /link/[token]).
	useEffect(() => {
		if (!appointment || actionHandledRef.current) return;
		actionHandledRef.current = true;
		const action = new URLSearchParams(window.location.search).get('action');
		if (action === 'cancel' || action === 'reschedule') setModal(action);
	}, [appointment]);

	const meta = useMemo(() => (appointment ? getBookingMeta(appointment) : null), [appointment]);
	const closeModal = useCallback(() => setModal('none'), []);
	const onRescheduled = useCallback(() => {
		setModal('none');
		fetchAppointment();
	}, [fetchAppointment]);

	if (loading) {
		return (
			<div className="space-y-6">
				<SkeletonBlock className="h-28" />
				<SkeletonBlock className="h-72" />
			</div>
		);
	}

	if (!appointment || !meta) {
		return (
			<div className="py-16 text-center">
				<p className="text-sm text-[var(--color-ink-muted)]">We couldn&apos;t find this booking.</p>
				<Link href="/account/appointments" className={buttonClasses('outline', 'sm', { className: 'mt-6' })}>
					Back to bookings
				</Link>
			</div>
		);
	}

	const rental = meta.kind === 'rental';
	const policy = getChangePolicy(appointment);
	const units = rental
		? meta.days
		: Math.max(1, Math.ceil((new Date(appointment.to).getTime() - new Date(appointment.from).getTime()) / 1000 / Math.max(1, appointment.product?.duration ?? 1)));

	return (
		<div>
			<Link
				href="/account/appointments"
				className="mb-6 inline-flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
			>
				<span aria-hidden>←</span> All bookings
			</Link>

			<AccountHeading
				eyebrow={`${rental ? 'Rental' : meta.kind === 'chauffeur' ? 'Chauffeur' : 'Booking'} · No. ${appointment.name}`}
				title={meta.title}
				action={<StatusBadge kind="appointment" status={appointment.status} />}
			/>

			<div className="mt-10 grid gap-8 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					{rental ? <RentalSummary meta={meta} /> : <SessionSummary appointment={appointment} meta={meta} />}
					<AddOnsPanel
						addOns={appointment.addOns ?? []}
						units={units}
						currency={appointment.order?.paymentCurrencyCode ?? 'AED'}
					/>
					<ActionsPanel
						policy={policy}
						isRental={rental}
						onCancel={() => setModal('cancel')}
						onReschedule={() => setModal('reschedule')}
					/>
				</div>
				<BookingAside appointment={appointment} meta={meta} />
			</div>

			{modal === 'cancel' ? (
				<CancelModal
					appointmentId={appointment.id}
					title={meta.title}
					isRental={rental}
					onClose={closeModal}
					onCanceled={() => router.push('/account/appointments')}
				/>
			) : null}

			{modal === 'reschedule' && rental ? (
				<RentalRescheduleModal
					appointment={appointment}
					pickUpDate={meta.pickUpDate}
					days={meta.days}
					onClose={closeModal}
					onRescheduled={onRescheduled}
				/>
			) : null}

			{modal === 'reschedule' && !rental ? (
				<SlotRescheduleModal appointment={appointment} onClose={closeModal} onRescheduled={onRescheduled} />
			) : null}
		</div>
	);
}
