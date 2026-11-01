'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import type { OrderDetailAppointment, OrderDetailResponse, PaymentInstructions } from '@opencals/storefront-sdk';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/format';
import { siteConfig } from '@/lib/site-config';
import { DURATION, EASE_OUT } from '@/components/motion/easing';
import { Reveal } from '@/components/motion/reveal';
import { buttonClasses } from '@/components/ui/button';
import { BookingCard } from './booking-card';
import { orderPendingReason, toConfirmedBooking } from './confirmed-booking';
import { PaymentInstructionsPanel } from './payment-instructions';
import { recallPaymentInstructions } from '@/lib/checkout-payment';
import { icsHref } from './ics';

const CHECK_INITIAL = { pathLength: 0 };
const CHECK_ANIMATE = { pathLength: 1 };
const CHECK_TRANSITION = { duration: DURATION.slow, ease: EASE_OUT, delay: 0.2 };
const SWR_OPTS = { revalidateOnFocus: false, errorRetryCount: 3 };

function Check() {
	const reduce = useReducedMotion();
	return (
		<span className="flex h-14 w-14 items-center justify-center border border-[var(--color-primary)] text-[var(--color-primary)]">
			<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
				<motion.path d="M4 12.5l5 5L20 6.5" strokeLinecap="square" initial={reduce ? false : CHECK_INITIAL} animate={CHECK_ANIMATE} transition={CHECK_TRANSITION} />
			</svg>
		</span>
	);
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
	return (
		<div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
			<span className="text-[var(--color-ink-muted)]">{label}</span>
			<span className={accent ? 'tabular text-lg text-[var(--color-primary)]' : 'tabular text-[var(--color-ink)]'}>{value}</span>
		</div>
	);
}

/** Payment status for the summary. Never a raw value or a blank. */
function paymentLabel(order: OrderDetailResponse, provider: PaymentInstructions['provider'] | null): string {
	if (order.isFullyPaid || order.paymentStatus === 'paid') return 'Paid';
	if (order.paymentStatus === 'partially-paid') return 'Part paid';
	if (order.paymentStatus === 'voided') return 'Cancelled — not charged';
	if (provider === 'stripe_invoice') return 'Invoice due';
	if (provider === 'bank_transfer') return 'Transfer due';
	if (provider === 'cash') return 'Pay at handover';
	return 'Unpaid';
}

const HEADLINE = {
	confirmed: { eyebrow: 'Booking confirmed', title: 'It\u2019s booked.' },
	awaiting_payment: { eyebrow: 'Awaiting payment', title: 'Booking received.' },
	awaiting_approval: { eyebrow: 'Awaiting confirmation', title: 'Booking received.' },
	unknown: { eyebrow: 'Booking received', title: 'Booking received.' },
} as const;

function OrderSkeleton() {
	return (
		<div className="mt-12 grid gap-6 lg:grid-cols-[1fr_340px]" aria-busy>
			<div className="aspect-[16/11] animate-pulse bg-[var(--color-surface)]" />
			<div className="h-64 animate-pulse bg-[var(--color-surface)]" />
		</div>
	);
}

/** Reads ?orderId, loads the order (the checkout signs the guest in) and renders the confirmation. */
export function ThankYouView() {
	const orderId = useSearchParams().get('orderId');
	const { status } = useSession();
	const key = orderId && status === 'authenticated' ? `/api/account/orders/${encodeURIComponent(orderId)}` : null;
	const { data: order, isLoading } = useSWR<OrderDetailResponse>(key, fetcher, SWR_OPTS);
	const loading = status === 'loading' || isLoading;

	const bookings = useMemo(
		() =>
			(order?.lineItems ?? [])
				.map((li) => li.appointment)
				.filter((a): a is OrderDetailAppointment => a != null)
				.map(toConfirmedBooking),
		[order],
	);
	const currency = order?.paymentCurrencyCode ?? siteConfig.currency;
	const calendar = useMemo(() => (bookings.length > 0 ? icsHref(bookings, order?.name ?? '') : null), [bookings, order?.name]);
	const email = order?.customerEmail ?? order?.customer?.email ?? null;

	// Payment instructions come back from checkout submit only; they're kept for this tab (read after mount).
	const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
	useEffect(() => {
		setInstructions(orderId ? recallPaymentInstructions(orderId) : null);
	}, [orderId]);

	// "Awaiting" only for pending bookings with a reason; a pending booking without one is being confirmed.
	const pending = orderPendingReason(bookings);
	const state = pending ?? (order && bookings.length > 0 ? 'confirmed' : 'unknown');
	const headline = HEADLINE[state];
	const owes = order ? !order.isFullyPaid && order.paymentStatus !== 'voided' && order.paymentStatus !== 'paid' : false;
	const showPayment = instructions !== null || (owes && (pending === 'awaiting_payment' || !!order?.paymentDueAt));
	const lede =
		pending === 'awaiting_payment'
			? 'We hold the car for you and confirm the booking as soon as your payment arrives.'
			: pending === 'awaiting_approval'
				? 'The concierge reviews every booking like this one and emails you as soon as it is confirmed.'
				: null;

	return (
		<section className="pt-32 pb-20 lg:pt-40 lg:pb-28">
			<div className="mx-auto max-w-[1200px] px-6 lg:px-10">
				<Reveal>
					<Check />
				</Reveal>
				<Reveal delay={0.08}>
					<p className="eyebrow mt-8">{order?.name ? `Booking #${order.name} · ${headline.eyebrow}` : headline.eyebrow}</p>
				</Reveal>
				<Reveal delay={0.14}>
					<h1 className="heading-display mt-4 text-4xl leading-[0.95] text-[var(--color-ink)] sm:text-6xl">{headline.title}</h1>
				</Reveal>
				<Reveal delay={0.2}>
					<p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-ink-muted)]">
						{lede ? `${lede} ` : null}
						{email ? (
							<>
								{pending ? 'The details are on their way to' : 'A confirmation is on its way to'} <span className="text-[var(--color-ink)]">{email}</span>. All times are Dubai time.
							</>
						) : (
							`${pending ? 'The details are on their way by email.' : 'A confirmation is on its way by email.'} All times are Dubai time.`
						)}
					</p>
				</Reveal>

				{loading ? (
					<OrderSkeleton />
				) : (
					<div className="mt-12 grid gap-6 lg:grid-cols-[1fr_340px]">
						<div className="space-y-6">
							{bookings.length > 0 ? (
								bookings.map((b) => <BookingCard key={b.id} booking={b} />)
							) : (
								<div className="border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-10">
									<p className="text-sm text-[var(--color-ink-muted)]">
										{status === 'authenticated' ? 'We could not load the booking details here.' : 'Sign in to see your booking details here.'} The confirmation email has everything you need, and the concierge is on WhatsApp if anything changes.
									</p>
									{status !== 'authenticated' ? (
										<Link
											href={`/auth/sign-in?callbackUrl=${encodeURIComponent(orderId ? `/account/orders/${orderId}` : '/account/orders')}`}
											className={buttonClasses('primary', 'md', { className: 'mt-6' })}
										>
											Sign in
										</Link>
									) : null}
								</div>
							)}
						</div>

						<aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
							{showPayment ? (
								<PaymentInstructionsPanel instructions={instructions} reference={order?.name ?? null} paymentDueAt={order?.paymentDueAt ?? null} />
							) : null}
							{order ? (
								<div className="border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-5">
									<p className="eyebrow">Payment</p>
									<div className="mt-3 divide-y divide-[var(--color-line)]">
										<Row label="Subtotal" value={formatPrice(order.subtotal ?? 0, currency)} />
										{(order.totalTax ?? 0) > 0 ? <Row label={order.taxesIncluded ? 'VAT (included)' : 'VAT'} value={formatPrice(order.totalTax, currency)} /> : null}
										<Row label="Total" value={formatPrice(order.total ?? 0, currency)} accent />
										<Row label="Status" value={paymentLabel(order, instructions?.provider ?? null)} />
									</div>
								</div>
							) : null}

							{calendar ? (
								<a href={calendar} download={`noir-drive-${order?.name ?? 'booking'}.ics`} className={buttonClasses('primary', 'md', { fullWidth: true })}>
									Add to calendar
								</a>
							) : null}
							<a href={siteConfig.contact.whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClasses('outline', 'md', { fullWidth: true })}>
								WhatsApp the concierge
							</a>
							{status === 'authenticated' ? (
								<Link href="/account/appointments" className={buttonClasses('ghost', 'md', { fullWidth: true })}>
									Manage booking
								</Link>
							) : null}
							<Link href="/fleet" className="link-underline block pt-2 text-center text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
								Back to the fleet
							</Link>
						</aside>
					</div>
				)}
			</div>
		</section>
	);
}
