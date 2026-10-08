'use client';

import { useCallback, useId, useMemo } from 'react';
import { clsx } from 'clsx';
import type { CheckoutQuestionResponse } from '@opencals/storefront-sdk';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { FileUploadField } from '@/components/booking/file-upload-field';
import type { FileUploads } from '@/hooks/use-file-upload';
import { questionTitle } from '@/hooks/use-checkout-questions';

interface QuestionsFormProps {
	questions: CheckoutQuestionResponse[];
	answers: Record<string, string>;
	setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
	/** Needed when any question is a `file-upload`. */
	uploads?: FileUploads | null;
	/** Render the Continue button (classic flow). Omit in the single-page /book flow. */
	onContinue?: () => void;
	valid?: boolean;
	/** Panel heading. Default "Documents & details". */
	title?: string;
	subtitle?: string;
	/** Drop the panel chrome when the parent section already provides it. */
	bare?: boolean;
}

const FIELD_LABEL = 'mb-2 block text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]';

/**
 * Checkout questions in NOIR style: text, long text, dropdown, rating chips,
 * a required-tick checkbox, and file uploads (licence, passport / Emirates ID).
 */
export function QuestionsForm({
	questions,
	answers,
	setAnswers,
	uploads = null,
	onContinue,
	valid = true,
	title = 'Documents & details',
	subtitle = 'We check these before handover, so the keys change hands in minutes.',
	bare = false,
}: QuestionsFormProps) {
	const ordered = useMemo(() => [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [questions]);
	const setAnswer = useCallback(
		(id: string, value: string) => setAnswers((prev) => ({ ...prev, [id]: value })),
		[setAnswers],
	);

	const fields = (
		<div className="space-y-7">
			{ordered.map((q) => (
				<QuestionField key={q.id} question={q} value={answers[q.id] ?? ''} onChange={setAnswer} uploads={uploads} />
			))}
		</div>
	);

	return (
		<div className="space-y-6">
			{bare ? (
				fields
			) : (
				<div className="border border-[var(--color-line)] bg-[var(--color-surface)]">
					<div className="border-b border-[var(--color-line)] px-5 py-5 sm:px-7">
						<p className="heading-display text-sm tracking-[0.08em] text-[var(--color-ink)]">{title}</p>
						<p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">{subtitle}</p>
					</div>
					<div className="px-5 py-6 sm:px-7">{fields}</div>
				</div>
			)}

			{onContinue ? (
				<Button variant="primary" size="lg" fullWidth onClick={onContinue} disabled={!valid}>
					Continue
				</Button>
			) : null}
		</div>
	);
}

interface QuestionFieldProps {
	question: CheckoutQuestionResponse;
	value: string;
	onChange: (id: string, value: string) => void;
	uploads: FileUploads | null;
}

function QuestionField({ question: q, value, onChange, uploads }: QuestionFieldProps) {
	const labelId = useId();
	const fieldId = useId();
	const translation = q.translations?.[0];
	const title = questionTitle(q);
	const description = translation?.description;
	const options = translation?.options;

	if (q.type === 'checkbox') {
		const checked = value === 'true';
		return (
			<label
				className={clsx(
					'flex cursor-pointer items-start gap-3.5 border px-4 py-4 transition-colors duration-300',
					checked ? 'border-[var(--color-primary)] bg-[var(--color-tint)]' : 'border-[var(--color-line-strong)] hover:border-[var(--color-primary-dark)]',
				)}
			>
				<input
					type="checkbox"
					checked={checked}
					required={q.required}
					onChange={(e) => onChange(q.id, e.target.checked ? 'true' : 'false')}
					className="peer sr-only"
				/>
				<span
					aria-hidden
					className={clsx(
						'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-primary)]',
						checked ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-black' : 'border-[var(--color-line-strong)]',
					)}
				>
					{checked ? (
						<svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
							<path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="square" />
						</svg>
					) : null}
				</span>
				<span className="text-sm leading-relaxed text-[var(--color-ink)]">
					{title}
					{q.required ? <span className="ml-1 text-[var(--color-primary)]">*</span> : null}
					{description ? <span className="mt-1 block text-[var(--color-ink-muted)]">{description}</span> : null}
				</span>
			</label>
		);
	}

	return (
		<div>
			<label id={labelId} htmlFor={q.type === 'file-upload' || q.type === 'rating' ? undefined : fieldId} className={FIELD_LABEL}>
				{title}
				{q.required ? <span className="ml-1 text-[var(--color-primary)]">*</span> : null}
			</label>
			{description ? <p className="-mt-1 mb-3 text-sm text-[var(--color-ink-muted)]">{description}</p> : null}

			{q.type === 'file-upload' ? (
				uploads ? (
					<FileUploadField question={q} uploads={uploads} labelId={labelId} />
				) : (
					<p className="text-sm text-[var(--color-ink-dim)]">Uploads aren&apos;t available here. We&apos;ll ask for this at handover.</p>
				)
			) : q.type === 'dropdown' && options ? (
				<select
					id={fieldId}
					required={q.required}
					value={value}
					onChange={(e) => onChange(q.id, e.target.value)}
					className="w-full rounded-[2px] border border-[var(--color-line-strong)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)]"
				>
					<option value="">Select…</option>
					{options.map((o) => (
						<option key={o} value={o}>
							{o}
						</option>
					))}
				</select>
			) : q.type === 'rating' ? (
				<div role="radiogroup" aria-labelledby={labelId} className="flex gap-1.5">
					{[1, 2, 3, 4, 5].map((n) => {
						const active = value === String(n);
						return (
							<button
								key={n}
								type="button"
								role="radio"
								aria-checked={active}
								onClick={() => onChange(q.id, String(n))}
								className={clsx(
									'tabular h-10 w-10 border text-sm transition-colors',
									active
										? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-black'
										: 'border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary)]',
								)}
							>
								{n}
							</button>
						);
					})}
				</div>
			) : q.type === 'multi-line-text-field' ? (
				<Textarea id={fieldId} required={q.required} value={value} onChange={(e) => onChange(q.id, e.target.value)} rows={3} />
			) : (
				<Input id={fieldId} type="text" required={q.required} value={value} onChange={(e) => onChange(q.id, e.target.value)} />
			)}
		</div>
	);
}
