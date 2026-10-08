'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { AppointmentListItemResponse, CollectionMeta } from '@opencals/storefront-sdk';
import { buttonClasses } from '@/components/ui/button';
import { AccountHeading, EmptyState, Pagination, SkeletonBlock } from '@/components/account/account-ui';
import { AppointmentRow } from '@/components/account/appointment-row';

export default function AppointmentsPage() {
	const [appointments, setAppointments] = useState<AppointmentListItemResponse[]>([]);
	const [meta, setMeta] = useState<CollectionMeta | null>(null);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);

	const fetchAppointments = useCallback(async (p: number) => {
		setLoading(true);
		try {
			const res = await fetch(`/api/account/appointments?take=10&page=${p}`);
			if (res.ok) {
				const data: { data: AppointmentListItemResponse[]; meta: CollectionMeta } = await res.json();
				setAppointments(data.data ?? []);
				setMeta(data.meta ?? null);
			}
		} catch {
			// silently fail
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAppointments(page);
	}, [page, fetchAppointments]);

	return (
		<div>
			<AccountHeading
				eyebrow="Bookings"
				title="Your bookings."
				intro="Rentals show pick-up and return dates in Dubai time. Open one for handover details."
				action={
					<Link href="/book" className={buttonClasses('primary', 'md', { className: 'max-sm:hidden' })}>
						Book a car
					</Link>
				}
			/>

			{loading ? (
				<div className="mt-10 space-y-px">
					{[0, 1, 2, 3].map((i) => (
						<SkeletonBlock key={i} className="h-24" />
					))}
				</div>
			) : appointments.length === 0 ? (
				<div className="mt-10">
					<EmptyState
						message="No bookings yet."
						action={
							<Link href="/fleet" className={buttonClasses('outline', 'sm')}>
								Choose a car
							</Link>
						}
					/>
				</div>
			) : (
				<>
					<div className="mt-10 divide-y divide-[var(--color-line)] border border-[var(--color-line)] bg-[var(--color-surface)]">
						{appointments.map((appt) => (
							<AppointmentRow key={appt.id} appointment={appt} />
						))}
					</div>
					{meta ? <Pagination page={meta.page} pageCount={meta.pageCount} onChange={setPage} /> : null}
				</>
			)}
		</div>
	);
}
