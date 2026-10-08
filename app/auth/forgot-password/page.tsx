'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { FORM_LABEL, Notice } from '@/components/auth/auth-feedback';

export default function ForgotPasswordPage() {
	const [sent, setSent] = useState(false);

	const form = useForm<ForgotPasswordFormValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: '' },
	});

	const { submit, isSubmitting } = useFormSubmit(form, { url: '/api/auth/forgot-password' });

	const onSubmit = async (data: ForgotPasswordFormValues) => {
		await submit({ email: data.email });
		setSent(true);
	};

	const handleResend = () => {
		setSent(false);
		form.handleSubmit(onSubmit)();
	};

	return (
		<AuthShell
			title={'Reset\npassword.'}
			intro="Enter your email and we will send you a link to choose a new password."
			footer={<AuthLink href="/auth/sign-in">Back to sign in</AuthLink>}
		>
			{sent ? (
				<div className="space-y-5">
					<Notice tone="success">
						<p className="font-medium">Check your email</p>
						<p className="mt-1 text-[var(--color-ink-muted)]">
							If an account exists for{' '}
							<span className="text-[var(--color-ink)]">{form.getValues('email')}</span>, we have sent a
							password reset link.
						</p>
					</Notice>
					<Button type="button" variant="outline" fullWidth onClick={handleResend}>
						Resend email
					</Button>
				</div>
			) : (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel className={FORM_LABEL}>Email</FormLabel>
									<FormControl>
										<Input {...field} type="email" autoComplete="email" placeholder="your@email.com" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
							{isSubmitting ? 'Sending...' : 'Send reset link'}
						</Button>
					</form>
				</Form>
			)}
		</AuthShell>
	);
}
