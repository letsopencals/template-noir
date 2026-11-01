import { memo } from 'react';
import { clsx } from 'clsx';
import type { AppointmentStatusType, OrderListItemResponse, StorefrontAppointmentPendingReason } from '@opencals/storefront-sdk';

type Tone = 'accent' | 'positive' | 'neutral' | 'warning' | 'negative';
type Badge = { label: string; tone: Tone };

const TONE: Record<Tone, { text: string; dot: string }> = {
	accent: { text: 'text-[var(--color-primary-bright)]', dot: 'bg-[var(--color-primary)]' },
	positive: { text: 'text-emerald-300', dot: 'bg-emerald-400' },
	neutral: { text: 'text-[var(--color-ink-muted)]', dot: 'bg-[var(--color-ink-dim)]' },
	warning: { text: 'text-amber-200', dot: 'bg-amber-300' },
	negative: { text: 'text-red-300', dot: 'bg-red-400' },
};

const APPOINTMENT: Record<string, Badge> = {
	scheduled: { label: 'Booked', tone: 'accent' },
	confirmed: { label: 'Confirmed', tone: 'positive' },
	completed: { label: 'Completed', tone: 'neutral' },
	canceled: { label: 'Cancelled', tone: 'negative' },
	// A pending booking without a reason is being confirmed right after checkout: show it as booked.
	pending: { label: 'Booked', tone: 'accent' },
	awaiting_payment: { label: 'Awaiting payment', tone: 'warning' },
	awaiting_approval: { label: 'Awaiting confirmation', tone: 'warning' },
} satisfies Record<AppointmentStatusType | StorefrontAppointmentPendingReason | 'confirmed', Badge>;

const PAYMENT: Record<string, Badge> = {
	paid: { label: 'Paid', tone: 'positive' },
	unpaid: { label: 'Unpaid', tone: 'warning' },
	'partially-paid': { label: 'Part paid', tone: 'warning' },
	voided: { label: 'Cancelled — not charged', tone: 'neutral' },
} satisfies Record<OrderListItemResponse['paymentStatus'], Badge>;

const FULFILLMENT: Record<string, Badge> = {
	fulfilled: { label: 'Fulfilled', tone: 'positive' },
	unfulfilled: { label: 'Unfulfilled', tone: 'neutral' },
	'partially-fulfilled': { label: 'Part fulfilled', tone: 'warning' },
} satisfies Record<OrderListItemResponse['fulfillmentStatus'], Badge>;

const REFUND: Record<string, Badge> = {
	'refund-owed': { label: 'Refund owed', tone: 'negative' },
	'partially-refunded': { label: 'Part refunded', tone: 'warning' },
	'fully-refunded': { label: 'Refunded', tone: 'negative' },
	unrefunded: { label: 'Not refunded', tone: 'neutral' },
} satisfies Record<OrderListItemResponse['refundStatus'], Badge>;

const MAPS = { appointment: APPOINTMENT, payment: PAYMENT, fulfillment: FULFILLMENT, refund: REFUND } as const;

/** "partially-fulfilled" → "Partially fulfilled", for values the maps don't know yet. */
function humanise(status: string): string {
	const words = status.replace(/[_-]+/g, ' ').trim();
	return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Unknown';
}

/**
 * Hairline status plate with a coloured dot. For appointments pass `pendingReason`: a pending booking with a
 * reason reads "Awaiting payment" / "Awaiting confirmation".
 */
export const StatusBadge = memo(function StatusBadge({
	kind,
	status,
	pendingReason,
	className,
}: {
	kind: keyof typeof MAPS;
	status: string | null | undefined;
	pendingReason?: StorefrontAppointmentPendingReason | null;
	className?: string;
}) {
	const key = kind === 'appointment' && status === 'pending' && pendingReason ? pendingReason : (status ?? '');
	const c = MAPS[kind][key] ?? { label: humanise(key), tone: 'neutral' as Tone };
	const t = TONE[c.tone];
	return (
		<span
			className={clsx(
				'inline-flex items-center gap-2 rounded-[2px] border border-[var(--color-line-strong)] px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.22em] whitespace-nowrap',
				t.text,
				className,
			)}
		>
			<span aria-hidden className={clsx('h-1.5 w-1.5 rounded-full', t.dot)} />
			{c.label}
		</span>
	);
});
