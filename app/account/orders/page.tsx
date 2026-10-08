'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { OrderListItemResponse, CollectionMeta, OrderListLineItem } from '@opencals/storefront-sdk';
import { formatPrice } from '@/lib/format';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { buttonClasses } from '@/components/ui/button';
import { AccountHeading, EmptyState, Pagination, SkeletonBlock } from '@/components/account/account-ui';
import { StatusBadge } from '@/components/account/status-badge';

// The SDK OrderListItemResponse type is missing `id` but it's returned by the API
type OrderWithId = OrderListItemResponse & { id: string };

export default function OrdersPage() {
	const [orders, setOrders] = useState<OrderWithId[]>([]);
	const [meta, setMeta] = useState<CollectionMeta | null>(null);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);

	const { formatCustom } = useDateFormatter();

	const fetchOrders = useCallback(async (p: number) => {
		setLoading(true);
		try {
			const res = await fetch(`/api/account/orders?take=10&page=${p}`);
			if (res.ok) {
				const data: { data: OrderWithId[]; meta: CollectionMeta } = await res.json();
				setOrders(data.data ?? []);
				setMeta(data.meta ?? null);
			}
		} catch {
			// silently fail
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchOrders(page);
	}, [page, fetchOrders]);

	return (
		<div>
			<AccountHeading eyebrow="Orders" title="Order history." intro="Receipts for every rental and chauffeur booking." />

			{loading ? (
				<div className="mt-10 space-y-px">
					{[0, 1, 2, 3].map((i) => (
						<SkeletonBlock key={i} className="h-24" />
					))}
				</div>
			) : orders.length === 0 ? (
				<div className="mt-10">
					<EmptyState
						message="No orders yet."
						action={
							<Link href="/book" className={buttonClasses('outline', 'sm')}>
								Book a car
							</Link>
						}
					/>
				</div>
			) : (
				<>
					<div className="mt-10 divide-y divide-[var(--color-line)] border border-[var(--color-line)] bg-[var(--color-surface)]">
						{orders.map((order) => (
							<Link
								key={order.id}
								href={`/account/orders/${order.id}`}
								className="block px-5 py-5 transition-colors hover:bg-[var(--color-surface-2)] sm:px-6"
							>
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="tabular text-sm text-[var(--color-ink)]">Order {order.name}</p>
										<p className="mt-1 text-xs text-[var(--color-ink-muted)]">
											{formatCustom(order.createdAt, 'ddd D MMM YYYY')}
										</p>
									</div>
									<div className="flex flex-col items-end gap-2">
										<p className="tabular text-sm text-[var(--color-ink)]">
											{formatPrice(order.total, order.paymentCurrencyCode)}
										</p>
										<StatusBadge kind="payment" status={order.paymentStatus} />
									</div>
								</div>

								{order.lineItems && order.lineItems.length > 0 ? (
									<div className="mt-4 space-y-1.5 border-t border-[var(--color-line)] pt-3">
										{order.lineItems.map((item: OrderListLineItem, i: number) => (
											<div key={i} className="flex text-xs text-[var(--color-ink-muted)]">
												<span>{item.appointment?.product?.title ?? 'Booking'}</span>
												<span className="leader-line" />
												<span className="tabular">{formatPrice(item.discountedTotal ?? 0, order.paymentCurrencyCode)}</span>
											</div>
										))}
									</div>
								) : null}
							</Link>
						))}
					</div>
					{meta ? <Pagination page={meta.page} pageCount={meta.pageCount} onChange={setPage} /> : null}
				</>
			)}
		</div>
	);
}
