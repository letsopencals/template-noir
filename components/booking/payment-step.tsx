'use client';

import { clsx } from 'clsx';
import type { CheckoutStartResponse, CustomerProviderCatalogItem } from '@opencals/storefront-sdk';
import { StripePayment } from '@/components/booking/stripe-payment';
import { Button } from '@/components/ui/button';

interface PaymentStepProps {
	providers: CustomerProviderCatalogItem[];
	provider: string | null;
	paymentData: CheckoutStartResponse | null;
	submitting: boolean;
	isExpired: boolean;
	onSelectProvider: (providerName: string) => void;
	onStripeSuccess: (paymentIntentId: string) => void;
	onStripeError: (message: string) => void;
	onSubmitCash: () => void;
	/** Copy for the pay-later (cash) confirmation. */
	cashTitle?: string;
	cashBody?: string;
	/** Drop the panel chrome when the parent section already provides it. */
	bare?: boolean;
}

const PANEL = 'border border-[var(--color-line)] bg-[var(--color-surface)]';
const PANEL_HEAD = 'border-b border-[var(--color-line)] px-5 py-5 sm:px-7';
const PANEL_TITLE = 'heading-display text-sm tracking-[0.08em] text-[var(--color-ink)]';

export function PaymentStep({
	providers,
	provider,
	paymentData,
	submitting,
	isExpired,
	onSelectProvider,
	onStripeSuccess,
	onStripeError,
	onSubmitCash,
	cashTitle = 'Pay at handover',
	cashBody = 'Nothing is charged now. You pay the rental when we hand over the keys.',
	bare = false,
}: PaymentStepProps) {
	// Branch on the RESPONSE provider for the fallback: when nothing is collectible the backend
	// overrides the requested provider with "no payment required" (cast: the pinned SDK's union
	// predates it). clientSecret is null in that case, so showStripe/showCash won't match.
	const showNoPayment = (paymentData?.provider as string) === 'no_payment_required';
	const clientSecret = !showNoPayment && provider === 'stripe' ? paymentData?.clientSecret : null;
	const showCash = !showNoPayment && provider === 'cash' && paymentData;

	const list =
		providers.length === 0 ? (
			<p className="text-sm text-[var(--color-ink-muted)]">No payment methods are set up. Message the concierge to finish your booking.</p>
		) : (
			<div role="radiogroup" aria-label="Payment method" className="space-y-2">
				{providers.map((p) => {
					const isSelected = provider === p.name;
					return (
						<button
							key={p.name}
							type="button"
							role="radio"
							aria-checked={isSelected}
							onClick={() => onSelectProvider(p.name)}
							disabled={submitting || isExpired}
							className={clsx(
								'flex w-full items-center gap-4 border px-4 py-4 text-left transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40',
								isSelected
									? 'border-[var(--color-primary)] bg-[var(--color-tint)]'
									: 'border-[var(--color-line-strong)] hover:border-[var(--color-primary-dark)]',
							)}
						>
							<span
								aria-hidden
								className={clsx(
									'flex h-4 w-4 shrink-0 items-center justify-center border',
									isSelected ? 'border-[var(--color-primary)]' : 'border-[var(--color-line-strong)]',
								)}
							>
								{isSelected ? <span className="h-2 w-2 bg-[var(--color-primary)]" /> : null}
							</span>
							<span className="min-w-0 flex-1">
								<span className="block text-sm text-[var(--color-ink)]">
									{p.name === 'cash' ? cashTitle : p.displayName}
								</span>
								{p.description ? (
									<span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">{p.description}</span>
								) : null}
							</span>
							{p.mode === 'test' ? (
								<span className="border border-[var(--color-primary-dark)] px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.2em] text-[var(--color-primary)]">
									Test
								</span>
							) : null}
						</button>
					);
				})}
			</div>
		);

	return (
		<div className="space-y-6">
			{bare ? (
				list
			) : (
				<div className={PANEL}>
					<div className={PANEL_HEAD}>
						<p className={PANEL_TITLE}>Payment</p>
					</div>
					<div className="px-5 py-5 sm:px-7">{list}</div>
				</div>
			)}

			{clientSecret ? (
				<StripePayment
					clientSecret={clientSecret}
					stripeAccountId={paymentData?.stripeAccountId}
					onSuccess={onStripeSuccess}
					onError={onStripeError}
					disabled={isExpired}
				/>
			) : null}

			{showNoPayment ? (
				<ConfirmPanel
					title="Nothing to pay"
					body="This booking is fully covered. Confirm to finish."
					submitting={submitting}
					disabled={isExpired}
					onConfirm={onSubmitCash}
				/>
			) : null}

			{showCash ? (
				<ConfirmPanel title={cashTitle} body={cashBody} submitting={submitting} disabled={isExpired} onConfirm={onSubmitCash} />
			) : null}
		</div>
	);
}

function ConfirmPanel({
	title,
	body,
	submitting,
	disabled,
	onConfirm,
}: {
	title: string;
	body: string;
	submitting: boolean;
	disabled: boolean;
	onConfirm: () => void;
}) {
	return (
		<div className={PANEL}>
			<div className={PANEL_HEAD}>
				<p className={PANEL_TITLE}>{title}</p>
			</div>
			<div className="space-y-5 px-5 py-6 sm:px-7">
				<p className="text-sm text-[var(--color-ink-muted)]">{body}</p>
				<Button variant="primary" size="lg" fullWidth onClick={onConfirm} disabled={submitting || disabled}>
					{submitting ? 'Confirming…' : 'Confirm booking'}
				</Button>
			</div>
		</div>
	);
}
