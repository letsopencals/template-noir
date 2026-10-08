'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import type { AppointmentListItemResponse, OrderListItemResponse, CollectionMeta } from '@opencals/storefront-sdk';
import { formatPrice } from '@/lib/format';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { buttonClasses } from '@/components/ui/button';
import { AccountHeading, EmptyState, Panel, PanelLink, SkeletonBlock } from '@/components/account/account-ui';
import { AppointmentRow } from '@/components/account/appointment-row';
import { StatusBadge } from '@/components/account/status-badge';

type OrderWithId = OrderListItemResponse & { id: string };

export default function AccountDashboard() {
	const { data: session } = useSession();
	const [appointments, setAppointments] = useState<AppointmentListItemResponse[]>([]);
	const [orders, setOrders] = useState<OrderWithId[]>([]);
	const [loading, setLoading] = useState(true);
	const { formatDate } = useDateFormatter();

	useEffect(() => {
		async function fetchData() {
			try {
				const [apptRes, ordersRes] = await Promise.all([
					fetch('/api/account/appointments?take=5'),
					fetch('/api/account/orders?take=5'),
				]);

				if (apptRes.ok) {
					const data: { data: AppointmentListItemResponse[]; meta: CollectionMeta } = await apptRes.json();
					setAppointments(data.data ?? []);
				}
				if (ordersRes.ok) {
					const data: { data: OrderWithId[]; meta: CollectionMeta } = await ordersRes.json();
					setOrders(data.data ?? []);
				}
			} catch {
				// silently fail
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, []);

	const firstName = session?.customer?.firstName;

	return (
		<div>
			<AccountHeading
				eyebrow="Overview"
				title={firstName ? `Welcome,\n${firstName}.` : 'Your\naccount.'}
				intro="Your rentals, chauffeur bookings and receipts."
				action={
					<Link href="/book" className={buttonClasses('primary', 'md')}>
						Book a car
					</Link>
				}
			/>

			{loading ? (
				<div className="mt-10 space-y-6">
					<SkeletonBlock className="h-56" />
					<SkeletonBlock className="h-44" />
				</div>
			) : (
				<div className="mt-10 space-y-8">
					<Panel title="Latest bookings" action={<PanelLink href="/account/appointments">View all</PanelLink>}>
						{appointments.length === 0 ? (
							<EmptyState
								message="No bookings yet."
								action={
									<Link href="/fleet" className={buttonClasses('outline', 'sm')}>
										See the fleet
									</Link>
								}
							/>
						) : (
							<div className="divide-y divide-[var(--color-line)]">
								{appointments.slice(0, 3).map((appt) => (
									<AppointmentRow key={appt.id} appointment={appt} compact />
								))}
							</div>
						)}
					</Panel>

					<Panel title="Recent orders" action={<PanelLink href="/account/orders">View all</PanelLink>}>
						{orders.length === 0 ? (
							<p className="text-sm text-[var(--color-ink-muted)]">No orders yet.</p>
						) : (
							<div className="divide-y divide-[var(--color-line)]">
								{orders.slice(0, 3).map((order) => (
									<Link
										key={order.id}
										href={`/account/orders/${order.id}`}
										className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-[var(--color-primary-bright)]"
									>
										<div>
											<p className="tabular text-sm text-[var(--color-ink)]">Order {order.name}</p>
											<p className="mt-1 text-xs text-[var(--color-ink-muted)]">{formatDate(order.createdAt)}</p>
										</div>
										<div className="flex flex-col items-end gap-2">
											<p className="tabular text-sm text-[var(--color-ink)]">
												{formatPrice(order.total, order.paymentCurrencyCode)}
											</p>
											<StatusBadge kind="payment" status={order.paymentStatus} />
										</div>
									</Link>
								))}
							</div>
						)}
					</Panel>

					<div className="grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2">
						<QuickLink href="/chauffeur" title="Book a chauffeur" body="Airport transfers, evenings out and full days." />
						<QuickLink href="/account/settings" title="Account settings" body="Update your name and password." />
					</div>
				</div>
			)}
		</div>
	);
}

function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
	return (
		<Link href={href} className="group bg-[var(--color-bg)] p-6 transition-colors hover:bg-[var(--color-surface)]">
			<p className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.24em] text-[var(--color-ink)]">
				{title}
				<span aria-hidden className="text-[var(--color-ink-dim)] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--color-primary)]">
					→
				</span>
			</p>
			<p className="mt-2 text-xs text-[var(--color-ink-muted)]">{body}</p>
		</Link>
	);
}
