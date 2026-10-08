'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { AuthFallback, FORM_LABEL, Notice } from '@/components/auth/auth-feedback';

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<AuthFallback />}>
			<ResetPasswordContent />
		</Suspense>
	);
}

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token') ?? '';

	const [success, setSuccess] = useState(false);

	const form = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { password: '', confirmPassword: '' },
	});

	const { submit, isSubmitting, error } = useFormSubmit(form, { url: '/api/auth/reset-password' });

	const onSubmit = async (data: ResetPasswordFormValues) => {
		const result = await submit({
			token,
			new_password: data.password,
		});

		if (result !== null) {
			setSuccess(true);
			setTimeout(() => router.push('/auth/sign-in'), 3000);
		}
	};

	if (!token) {
		return (
			<AuthShell
				title={'Link\nmissing.'}
				intro="This reset link is invalid or incomplete."
				footer={<AuthLink href="/auth/forgot-password">Request a new reset link</AuthLink>}
			/>
		);
	}

	return (
		<AuthShell
			title={'New\npassword.'}
			intro="Choose a new password for your account."
			footer={<AuthLink href="/auth/sign-in">Back to sign in</AuthLink>}
		>
			{success ? (
				<Notice tone="success">
					<p className="font-medium">Password reset</p>
					<p className="mt-1 text-[var(--color-ink-muted)]">Taking you to sign in...</p>
				</Notice>
			) : (
				<>
					{error ? <Notice className="mb-6">{error}</Notice> : null}

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel className={FORM_LABEL}>New password</FormLabel>
										<FormControl>
											<Input {...field} type="password" autoComplete="new-password" placeholder="Min. 6 characters" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel className={FORM_LABEL}>Confirm password</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="password"
												autoComplete="new-password"
												placeholder="Confirm your password"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
								{isSubmitting ? 'Resetting...' : 'Reset password'}
							</Button>
						</form>
					</Form>
				</>
			)}
		</AuthShell>
	);
}
