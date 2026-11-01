'use client';

import { useId, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PHONE_HINT, PHONE_PLACEHOLDER } from '@/lib/field-errors';

interface DetailsStepProps {
	email: string;
	firstName: string;
	lastName: string;
	customerId: string | null;
	onChangeEmail: (v: string) => void;
	onChangeFirstName: (v: string) => void;
	onChangeLastName: (v: string) => void;
	/** Shown when both are passed. */
	phone?: string;
	onChangePhone?: (v: string) => void;
	phoneRequired?: boolean;
	fieldErrors: Record<string, string[]>;
	submitting: boolean;
	canSubmit: boolean;
	onSubmit: () => void;
	submitLabel?: string;
	/** Hide the submit button (the single-page /book flow submits from its own bar). */
	hideSubmit?: boolean;
	/** Drop the panel chrome when the parent section already provides it. */
	bare?: boolean;
	/** Extra content under the fields (e.g. the questions form). */
	children?: ReactNode;
}

export function DetailsStep({
	email,
	firstName,
	lastName,
	customerId,
	onChangeEmail,
	onChangeFirstName,
	onChangeLastName,
	phone,
	onChangePhone,
	phoneRequired = false,
	fieldErrors,
	submitting,
	canSubmit,
	onSubmit,
	submitLabel = 'Continue to payment',
	hideSubmit = false,
	bare = false,
	children,
}: DetailsStepProps) {
	const fields = (
		<div className="space-y-5">
			<div className="grid gap-5 sm:grid-cols-2">
				<Field label="First name" error={fieldErrors.firstName}>
					{(a11y) => (
						<Input {...a11y} type="text" autoComplete="given-name" value={firstName} onChange={(e) => onChangeFirstName(e.target.value)} />
					)}
				</Field>
				<Field label="Last name" error={fieldErrors.lastName}>
					{(a11y) => (
						<Input {...a11y} type="text" autoComplete="family-name" value={lastName} onChange={(e) => onChangeLastName(e.target.value)} />
					)}
				</Field>
			</div>
			<div className="grid gap-5 sm:grid-cols-2">
				<Field label="Email" required error={fieldErrors.email}>
					{(a11y) => (
						<Input
							{...a11y}
							type="email"
							required
							autoComplete="email"
							value={email}
							onChange={(e) => onChangeEmail(e.target.value)}
							placeholder="you@example.com"
						/>
					)}
				</Field>
				{onChangePhone ? (
					<Field label="Mobile (WhatsApp)" required={phoneRequired} error={fieldErrors.phone} hint={PHONE_HINT}>
						{(a11y) => (
							<Input
								{...a11y}
								type="tel"
								required={phoneRequired}
								autoComplete="tel"
								inputMode="tel"
								value={phone ?? ''}
								onChange={(e) => onChangePhone(e.target.value)}
								placeholder={PHONE_PLACEHOLDER}
							/>
						)}
					</Field>
				) : null}
			</div>
			{children}
		</div>
	);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
			className="space-y-6"
		>
			{bare ? (
				fields
			) : (
				<div className="border border-[var(--color-line)] bg-[var(--color-surface)]">
					<div className="border-b border-[var(--color-line)] px-5 py-5 sm:px-7">
						<p className="heading-display text-sm tracking-[0.08em] text-[var(--color-ink)]">Your details</p>
						<p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
							{customerId ? 'Signed in. Check your details below.' : 'We send the confirmation and handover updates here.'}
						</p>
					</div>
					<div className="px-5 py-6 sm:px-7">{fields}</div>
				</div>
			)}

			{hideSubmit ? null : (
				<Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting || !canSubmit}>
					{submitting ? 'Reserving…' : submitLabel}
				</Button>
			)}
		</form>
	);
}

/** Props for the field's control: its id, plus aria-invalid and aria-describedby (hint, error). */
export interface FieldControlProps {
	id: string;
	'aria-invalid'?: true;
	'aria-describedby'?: string;
}

function Field({
	label,
	required,
	error,
	hint,
	children,
}: {
	label: string;
	required?: boolean;
	/** The field's messages (from the API or the client check), shown under it. */
	error?: string[];
	hint?: string;
	children: (control: FieldControlProps) => ReactNode;
}) {
	const id = useId();
	const hintId = `${id}-hint`;
	const errorId = `${id}-error`;
	const message = error?.length ? error.join(' ') : null;
	// The error replaces the hint (the phone's error usually repeats it).
	const showHint = !!hint && !message;
	const describedBy = [showHint ? hintId : null, message ? errorId : null].filter(Boolean).join(' ');
	return (
		<div>
			<label htmlFor={id} className="mb-2 block text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
				{label}
				{required ? <span className="ml-1 text-[var(--color-primary)]">*</span> : null}
			</label>
			{children({ id, ...(message ? { 'aria-invalid': true } : {}), ...(describedBy ? { 'aria-describedby': describedBy } : {}) })}
			{showHint ? (
				<p id={hintId} className="mt-1.5 text-xs text-[var(--color-ink-dim)]">
					{hint}
				</p>
			) : null}
			{message ? (
				<p id={errorId} className="mt-1.5 text-xs text-[#E5787A]">
					{message}
				</p>
			) : null}
		</div>
	);
}
