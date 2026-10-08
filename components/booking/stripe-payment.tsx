'use client';

import { useMemo, useState } from 'react';
import { type Appearance, type StripeError, loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

/** Stripe Elements in NOIR colours: black field, ivory text, champagne focus, squared 2px. */
const APPEARANCE: Appearance = {
	theme: 'night',
	variables: {
		colorPrimary: '#C8A96B',
		colorBackground: '#0B0B0C',
		colorText: '#F4F1EA',
		colorTextSecondary: '#A19D94',
		colorTextPlaceholder: '#5E5B55',
		colorDanger: '#E5787A',
		fontFamily: 'Inter Tight, system-ui, -apple-system, sans-serif',
		spacingUnit: '4px',
		borderRadius: '2px',
	},
	rules: {
		'.Input': { border: '1px solid rgba(255, 255, 255, 0.16)', boxShadow: 'none' },
		'.Input:focus': { border: '1px solid #C8A96B', boxShadow: 'none' },
		'.Tab': { border: '1px solid rgba(255, 255, 255, 0.16)', boxShadow: 'none' },
		'.Tab--selected': { border: '1px solid #C8A96B', backgroundColor: '#17130B' },
		'.Label': { textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '11px', color: '#A19D94' },
	},
};

interface StripePaymentProps {
	clientSecret: string;
	stripeAccountId?: string | null;
	onSuccess: (paymentIntentId: string) => void;
	onError: (message: string) => void;
	disabled?: boolean;
}

export function StripePayment({ clientSecret, stripeAccountId, onSuccess, onError, disabled }: StripePaymentProps) {
	const stripePromise = useMemo(() => {
		if (!publishableKey) return null;
		return loadStripe(publishableKey, {
			stripeAccount: stripeAccountId ?? undefined,
		});
	}, [stripeAccountId]);

	const options = useMemo(() => ({ clientSecret, appearance: APPEARANCE }), [clientSecret]);

	if (!publishableKey) {
		return (
			<div className="border border-[#E5787A]/40 bg-[#E5787A]/10 p-6">
				<p className="text-sm text-[#E5787A]">
					Stripe is not configured. Set{' '}
					<code className="tabular bg-black/40 px-1 py-0.5 text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> in your environment.
				</p>
			</div>
		);
	}

	if (!stripePromise) return null;

	return (
		<Elements stripe={stripePromise} options={options}>
			<StripePaymentForm onSuccess={onSuccess} onError={onError} disabled={disabled} />
		</Elements>
	);
}

function StripePaymentForm({
	onSuccess,
	onError,
	disabled,
}: {
	onSuccess: (paymentIntentId: string) => void;
	onError: (message: string) => void;
	disabled?: boolean;
}) {
	const stripe = useStripe();
	const elements = useElements();
	const [processing, setProcessing] = useState(false);

	const handlePay = async () => {
		if (!stripe || !elements || processing) return;
		setProcessing(true);
		try {
			const { error, paymentIntent } = await stripe.confirmPayment({
				elements,
				redirect: 'if_required',
			});
			if (error) {
				onError((error as StripeError).message ?? 'Payment failed');
				return;
			}
			if (paymentIntent?.id) {
				onSuccess(paymentIntent.id);
			} else {
				onError('Payment confirmation did not return a valid result.');
			}
		} catch (err: unknown) {
			onError(err instanceof Error ? err.message : 'Payment failed');
		} finally {
			setProcessing(false);
		}
	};

	return (
		<div className="border border-[var(--color-line)] bg-[var(--color-surface)]">
			<div className="border-b border-[var(--color-line)] px-5 py-4 sm:px-7">
				<p className="text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-primary)]">Card payment</p>
			</div>
			<div className="space-y-5 px-5 py-5 sm:px-7">
				<PaymentElement options={{ layout: 'tabs' }} />
				<Button
					variant="primary"
					size="lg"
					fullWidth
					className="gap-3"
					onClick={handlePay}
					disabled={!stripe || !elements || processing || disabled}
				>
					{processing ? (
						<>
							<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
							Processing payment…
						</>
					) : (
						<>
							Pay &amp; confirm
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
