'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/lib/schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { Panel } from '@/components/account/account-ui';
import { FORM_LABEL, Notice } from '@/components/auth/auth-feedback';

const FIELDS: Array<{ name: keyof ChangePasswordFormValues; label: string; hint?: string; placeholder: string; autoComplete: string }> = [
	{ name: 'currentPassword', label: 'Current password', hint: 'leave empty if not set', placeholder: 'Current password', autoComplete: 'current-password' },
	{ name: 'newPassword', label: 'New password', placeholder: 'Min. 6 characters', autoComplete: 'new-password' },
	{ name: 'confirmPassword', label: 'Confirm new password', placeholder: 'Repeat new password', autoComplete: 'new-password' },
];

export function PasswordForm() {
	const [success, setSuccess] = useState(false);
	const form = useForm<ChangePasswordFormValues>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
	});
	const submit = useFormSubmit<ChangePasswordFormValues>(form, { url: '/api/account/password', method: 'PUT' });

	const handleChange = form.handleSubmit(async (data) => {
		const result = await submit.submit({ currentPassword: data.currentPassword, newPassword: data.newPassword });
		if (result !== null) {
			setSuccess(true);
			form.reset();
			setTimeout(() => setSuccess(false), 3000);
		}
	});

	return (
		<Panel title="Password">
			<Form {...form}>
				<form onSubmit={handleChange}>
					<div className="space-y-5">
						{FIELDS.map((f) => (
							<FormField
								key={f.name}
								control={form.control}
								name={f.name}
								render={({ field }) => (
									<FormItem>
										<FormLabel className={FORM_LABEL}>
											{f.label}
											{f.hint ? (
												<span className="ml-2 normal-case tracking-normal text-[var(--color-ink-dim)]">({f.hint})</span>
											) : null}
										</FormLabel>
										<FormControl>
											<Input {...field} type="password" placeholder={f.placeholder} autoComplete={f.autoComplete} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						))}
					</div>

					{submit.error ? (
						<Notice tone="error" className="mt-5">
							{submit.error}
						</Notice>
					) : null}
					{success ? (
						<Notice tone="success" className="mt-5">
							Password changed.
						</Notice>
					) : null}

					<Button type="submit" className="mt-7" disabled={submit.isSubmitting}>
						{submit.isSubmitting ? 'Changing…' : 'Change password'}
					</Button>
				</form>
			</Form>
		</Panel>
	);
}
