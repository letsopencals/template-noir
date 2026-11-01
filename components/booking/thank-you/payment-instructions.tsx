'use client';

import { memo } from 'react';
import type { PaymentInstructions } from '@opencals/storefront-sdk';
import { siteConfig } from '@/lib/site-config';
import { buttonClasses } from '@/components/ui/button';

const DUE = new Intl.DateTimeFormat('en-GB', {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	hour: '2-digit',
	minute: '2-digit',
	hour12: false,
	timeZone: siteConfig.timezone,
});

function dueLabel(iso: string | null | undefined): string | null {
	if (!iso) return null;
	const at = new Date(iso);
	return Number.isNaN(at.getTime()) ? null : `${DUE.format(at)} Dubai time`;
}

function Line({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
			<span className="shrink-0 text-[var(--color-ink-muted)]">{label}</span>
			<span className="tabular break-all text-right text-[var(--color-ink)] select-all">{value}</span>
		</div>
	);
}

interface PaymentInstructionsPanelProps {
	/** From checkout submit (kept in this tab); null after a reload in another tab or session. */
	instructions: PaymentInstructions | null;
	/** Order number, used as the transfer reference. */
	reference: string | null;
	/** The order's own deadline, for when the instructions are gone. */
	paymentDueAt: string | null;
}

/** How to pay a bank-transfer, invoice or cash booking. Without the checkout data it points to the email. */
export const PaymentInstructionsPanel = memo(function PaymentInstructionsPanel({ instructions, reference, paymentDueAt }: PaymentInstructionsPanelProps) {
	const due = dueLabel(instructions?.dueAt ?? paymentDueAt);
	const bank = instructions?.bankDetails ?? null;
	const invoiceUrl = instructions?.hostedInvoiceUrl?.startsWith('https://') ? instructions.hostedInvoiceUrl : null;
	const provider = instructions?.provider ?? null;
	const bankLines = bank
		? ([
				['Account name', bank.accountName],
				['Bank', bank.bankName],
				['IBAN / account', bank.iban],
				['SWIFT / BIC', bank.swift],
			].filter(([, v]) => typeof v === 'string' && v.trim()) as Array<[string, string]>)
		: [];

	let intro: string;
	if (!instructions) intro = 'Your payment details are in the confirmation email.';
	else if (provider === 'stripe_invoice')
		intro = invoiceUrl ? 'Pay the invoice online with the secure link below. A copy is in your email.' : 'Your invoice is on its way by email, with a secure link to pay it.';
	else if (provider === 'bank_transfer') intro = bankLines.length > 0 ? 'Transfer the total to the account below.' : 'Our bank details are in your confirmation email.';
	else if (provider === 'cash') intro = 'Nothing is charged online. You pay in person at handover.';
	else intro = 'Your payment details are in the confirmation email.';

	return (
		<div className="border border-[var(--color-primary-dark)] bg-[var(--color-tint)] px-6 py-5">
			<p className="eyebrow">How to pay</p>
			<p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">{intro}</p>
			{bankLines.length > 0 || (provider === 'bank_transfer' && reference) || due ? (
				<div className="mt-3 divide-y divide-[var(--color-line)]">
					{bankLines.map(([label, value]) => (
						<Line key={label} label={label} value={value} />
					))}
					{provider === 'bank_transfer' && reference ? <Line label="Reference" value={reference} /> : null}
					{due ? <Line label="Pay by" value={due} /> : null}
				</div>
			) : null}
			{invoiceUrl ? (
				<a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses('primary', 'md', { fullWidth: true, className: 'mt-5' })}>
					Pay invoice
				</a>
			) : null}
			{due ? <p className="mt-4 text-xs text-[var(--color-ink-dim)]">An unpaid booking may be cancelled after this time.</p> : null}
		</div>
	);
});
