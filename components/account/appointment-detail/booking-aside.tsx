import Link from 'next/link';
import type { AppointmentDetailResponse } from '@opencals/storefront-sdk';
import { formatPrice } from '@/lib/format';
import { buttonClasses } from '@/components/ui/button';
import { Panel } from '@/components/account/account-ui';
import { dayLabel, type BookingMeta } from '@/components/account/booking-meta';

/** Right rail: what was booked, the rate, and "book again". */
export function BookingAside({ appointment, meta }: { appointment: AppointmentDetailResponse; meta: BookingMeta }) {
	const product = appointment.product;
	const currency = appointment.order?.paymentCurrencyCode ?? 'AED';
	const rental = meta.kind === 'rental';

	return (
		<div className="space-y-6">
			{product ? (
				<Panel title={rental ? 'Car' : 'Package'}>
					<p className="text-base text-[var(--color-ink)]">{product.title}</p>
					{product.price != null && product.price > 0 ? (
						<p className="mt-4 flex items-baseline text-sm">
							<span className="eyebrow">{rental ? 'Per day' : 'From'}</span>
							<span className="leader-line" />
							<span className="tabular text-[var(--color-ink)]">{formatPrice(product.price, currency)}</span>
						</p>
					) : null}
					{rental ? (
						<p className="mt-3 flex items-baseline text-sm">
							<span className="eyebrow">Length</span>
							<span className="leader-line" />
							<span className="tabular text-[var(--color-ink)]">{dayLabel(meta.days)}</span>
						</p>
					) : null}
					{product.slug && rental ? (
						<Link
							href={`/fleet/${encodeURIComponent(product.slug)}`}
							className="link-underline mt-5 inline-block text-[0.64rem] uppercase tracking-[0.24em] text-[var(--color-primary)]"
						>
							View the car
						</Link>
					) : null}
				</Panel>
			) : null}

			{appointment.order?.id ? (
				<Link
					href={`/account/orders/${appointment.order.id}`}
					className={buttonClasses('outline', 'md', { fullWidth: true })}
				>
					View receipt
				</Link>
			) : null}

			{meta.bookAgainHref ? (
				<Link href={meta.bookAgainHref} className={buttonClasses('primary', 'md', { fullWidth: true })}>
					Book again
				</Link>
			) : null}
		</div>
	);
}
