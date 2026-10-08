'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/auth/auth-feedback';
import { DESTRUCTIVE_BUTTON, Modal, readError } from './modal';

export function CancelModal({
	appointmentId,
	title,
	isRental,
	onClose,
	onCanceled,
}: {
	appointmentId: string;
	title: string;
	isRental: boolean;
	onClose: () => void;
	onCanceled: () => void;
}) {
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	async function handleCancel() {
		setSubmitting(true);
		setError('');
		try {
			const res = await fetch(`/api/account/appointments/${appointmentId}/cancel`, { method: 'PUT' });
			if (res.ok) {
				onCanceled();
			} else {
				setError(await readError(res, 'We could not cancel this booking.'));
			}
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Modal eyebrow="Cancel booking" title={isRental ? 'Cancel this rental?' : 'Cancel this booking?'} onClose={onClose}>
			<p className="mt-5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
				Your booking for <span className="text-[var(--color-ink)]">{title}</span> will be cancelled. This can&apos;t be
				undone. Refunds follow the cancellation policy on your confirmation.
			</p>

			{error ? (
				<Notice tone="error" className="mt-5">
					{error}
				</Notice>
			) : null}

			<div className="mt-8 flex flex-col gap-3 sm:flex-row">
				<Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
					Keep booking
				</Button>
				<button type="button" onClick={handleCancel} disabled={submitting} className={`${DESTRUCTIVE_BUTTON} flex-1`}>
					{submitting ? 'Cancelling…' : 'Cancel booking'}
				</button>
			</div>
		</Modal>
	);
}
