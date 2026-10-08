'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { OrderDetailResponse, OrderDetailAppointment } from '@opencals/storefront-sdk';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { buttonClasses } from '@/components/ui/button';
import { AccountHeading, Panel, SkeletonBlock } from '@/components/account/account-ui';
import { StatusBadge } from '@/components/account/status-badge';
import { AppointmentRow } from '@/components/account/appointment-row';
import { OrderLineItems } from '@/components/account/order-detail/order-line-items';
import { OrderSummary } from '@/components/account/order-detail/order-summary';

export default function OrderDetailPage() {
	const { orderId } = useParams<{ orderId: string }>();
	const [order, setOrder] = useState<OrderDetailResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const { formatCustom } = useDateFormatter();

	useEffect(() => {
		async function fetchOrder() {
			try {
				const res = await fetch(`/api/account/orders/${orderId}`);
				if (res.ok) setOrder(await res.json());
			} catch {
				// silently fail
			} finally {
				setLoading(false);
			}
		}
		fetchOrder();
	}, [orderId]);

	if (loading) {
		return (
			<div className="space-y-6">
				<SkeletonBlock className="h-28" />
				<SkeletonBlock className="h-72" />
			</div>
		);
	}

	if (!order) {
		return (
			<div className="py-16 text-center">
				<p className="text-sm text-[var(--color-ink-muted)]">We couldn&apos;t find this order.</p>
				<Link href="/account/orders" className={buttonClasses('outline', 'sm', { className: 'mt-6' })}>
					Back to orders
				</Link>
			</div>
		);
	}

	const lineItems = order.lineItems ?? [];
	// Appointments live on each order line item (SDK >= 0.3.8).
	const appointments = lineItems.map((li) => li.appointment).filter((a): a is OrderDetailAppointment => a != null);

	return (
		<div>
			<Link
				href="/account/orders"
				className="mb-6 inline-flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
			>
				<span aria-hidden>←</span> All orders
			</Link>

			<AccountHeading
				eyebrow={formatCustom(order.createdAt, 'dddd D MMMM YYYY')}
				title={`Order ${order.name}`}
				action={
					<div className="flex flex-wrap gap-2">
						<StatusBadge kind="payment" status={order.paymentStatus} />
						<StatusBadge kind="fulfillment" status={order.fulfillmentStatus} />
						{order.refundStatus !== 'unrefunded' ? <StatusBadge kind="refund" status={order.refundStatus} /> : null}
					</div>
				}
			/>

			<div className="mt-10 grid gap-8 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					{appointments.length > 0 ? (
						<Panel title="Bookings" className="!p-0">
							<div className="divide-y divide-[var(--color-line)] border-t border-[var(--color-line)]">
								{appointments.map((appt) => (
									<AppointmentRow key={appt.id} appointment={appt} />
								))}
							</div>
						</Panel>
					) : null}
					<OrderLineItems lineItems={lineItems} currency={order.paymentCurrencyCode} />
				</div>

				<div className="space-y-6">
					<OrderSummary order={order} />
					<Link href="/book" className={buttonClasses('outline', 'md', { fullWidth: true })}>
						Book another car
					</Link>
				</div>
			</div>
		</div>
	);
}
