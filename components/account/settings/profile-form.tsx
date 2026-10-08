'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileFormValues } from '@/lib/schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { Panel, SkeletonBlock } from '@/components/account/account-ui';
import { FIELD_LABEL, FORM_LABEL, Notice } from '@/components/auth/auth-feedback';

export function ProfileForm() {
	const [loading, setLoading] = useState(true);
	const [success, setSuccess] = useState(false);
	const [email, setEmail] = useState('');

	const form = useForm<UpdateProfileFormValues>({
		resolver: zodResolver(updateProfileSchema),
		defaultValues: { firstName: '', lastName: '' },
	});
	const submit = useFormSubmit<UpdateProfileFormValues>(form, { url: '/api/account/profile', method: 'PUT' });

	useEffect(() => {
		async function fetchProfile() {
			try {
				const res = await fetch('/api/account/profile');
				if (res.ok) {
					const data = await res.json();
					form.reset({ firstName: data.firstName ?? '', lastName: data.lastName ?? '' });
					setEmail(data.email ?? '');
				}
			} catch {
				// silently fail
			} finally {
				setLoading(false);
			}
		}
		fetchProfile();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSave = form.handleSubmit(async (data) => {
		const result = await submit.submit({ firstName: data.firstName, lastName: data.lastName });
		if (result !== null) {
			setSuccess(true);
			setTimeout(() => setSuccess(false), 3000);
		}
	});

	return (
		<Panel title="Profile">
			{loading ? (
				<div className="space-y-4">
					<SkeletonBlock className="h-12" />
					<SkeletonBlock className="h-12" />
				</div>
			) : (
				<Form {...form}>
					<form onSubmit={handleSave}>
						<div className="space-y-5">
							<div>
								<label htmlFor="settings-email" className={FIELD_LABEL}>
									Email
								</label>
								<Input id="settings-email" type="email" value={email} disabled readOnly />
							</div>
							<div className="grid gap-5 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel className={FORM_LABEL}>First name</FormLabel>
											<FormControl>
												<Input {...field} type="text" autoComplete="given-name" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="lastName"
									render={({ field }) => (
										<FormItem>
											<FormLabel className={FORM_LABEL}>Last name</FormLabel>
											<FormControl>
												<Input {...field} type="text" autoComplete="family-name" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{submit.error ? (
							<Notice tone="error" className="mt-5">
								{submit.error}
							</Notice>
						) : null}
						{success ? (
							<Notice tone="success" className="mt-5">
								Profile updated.
							</Notice>
						) : null}

						<Button type="submit" className="mt-7" disabled={submit.isSubmitting}>
							{submit.isSubmitting ? 'Saving…' : 'Save changes'}
						</Button>
					</form>
				</Form>
			)}
		</Panel>
	);
}
