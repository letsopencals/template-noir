import type { OrderDetailResponse } from '@opencals/storefront-sdk';
import { formatPrice } from '@/lib/format';
import { Panel } from '@/components/account/account-ui';

function Line({ label, value, tone }: { label: string; value: string; tone?: 'total' | 'warn' | 'muted' }) {
	return (
		<div className="flex items-baseline text-sm">
			<span className={tone === 'total' ? 'eyebrow text-[var(--color-ink)]' : 'eyebrow'}>{label}</span>
			<span className="leader-line" />
			<span
				className={
					tone === 'total'
						? 'tabular text-lg text-[var(--color-ink)]'
						: tone === 'warn'
							? 'tabular text-[var(--color-primary-bright)]'
							: 'tabular text-[var(--color-ink-muted)]'
				}
			>
				{value}
			</span>
		</div>
	);
}

/** Totals plus what has been paid, refunded and is still due. */
export function OrderSummary({ order }: { order: OrderDetailResponse }) {
	const currency = order.paymentCurrencyCode;
	return (
		<Panel title="Summary">
			<div className="space-y-3">
				<Line label="Subtotal" value={formatPrice(order.subtotal, currency)} />
				{order.totalTax > 0 ? <Line label="Tax" value={formatPrice(order.totalTax, currency)} /> : null}
				<div className="border-t border-[var(--color-line)] pt-3">
					<Line label="Total" value={formatPrice(order.total, currency)} tone="total" />
				</div>
			</div>
			<div className="mt-5 space-y-3 border-t border-[var(--color-line)] pt-5">
				<Line label="Paid" value={formatPrice(order.paidTotal, currency)} />
				{order.refundedTotal > 0 ? <Line label="Refunded" value={`−${formatPrice(order.refundedTotal, currency)}`} /> : null}
				{order.dueToPay > 0 ? <Line label="Due" value={formatPrice(order.dueToPay, currency)} tone="warn" /> : null}
			</div>
			<p className="mt-5 text-xs leading-relaxed text-[var(--color-ink-dim)]">
				Security deposits are held on a card at handover and are not part of this order.
			</p>
		</Panel>
	);
}
