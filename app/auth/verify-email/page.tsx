'use client';

import { Suspense, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button';
import { AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { AuthFallback, Notice, Spinner } from '@/components/auth/auth-feedback';

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={<AuthFallback />}>
			<VerifyEmailContent />
		</Suspense>
	);
}

type Status = 'pending' | 'verifying' | 'success' | 'error';

const TITLES: Record<Status, string> = {
	pending: 'Check your\nemail.',
	verifying: 'Verifying.',
	success: 'Email\nverified.',
	error: 'Verification\nfailed.',
};

function VerifyEmailContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token');
	const email = searchParams.get('email');

	const [status, setStatus] = useState<Status>(token ? 'verifying' : 'pending');
	const [error, setError] = useState<string | null>(null);

	// Auto-verify if token is present
	useEffect(() => {
		if (!token) return;

		async function verify() {
			try {
				const result = await signIn('verify-token', {
					token,
					redirect: false,
				});

				if (result?.error) {
					setStatus('error');
					setError('Verification failed. The link may have expired.');
				} else {
					setStatus('success');
					setTimeout(() => {
						router.push('/account');
						router.refresh();
					}, 2000);
				}
			} catch {
				setStatus('error');
				setError('Something went wrong. Please try again.');
			}
		}

		verify();
	}, [token, router]);

	// Resend verification
	const [resending, setResending] = useState(false);
	const [resent, setResent] = useState(false);

	const handleResend = async () => {
		if (!email || resending) return;
		setResending(true);

		try {
			await fetch('/api/auth/sign-up', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password: '' }), // This won't create a new account, just resend
			});
		} finally {
			setResent(true);
			setResending(false);
		}
	};

	return (
		<AuthShell
			key={status}
			title={TITLES[status]}
			footer={<AuthLink href="/auth/sign-in">Back to sign in</AuthLink>}
		>
			{status === 'verifying' ? (
				<div className="flex items-center gap-4 text-sm text-[var(--color-ink-muted)]">
					<Spinner className="h-6 w-6" />
					Verifying your email...
				</div>
			) : null}

			{status === 'success' ? (
				<Notice tone="success">Your email is verified. Taking you to your account...</Notice>
			) : null}

			{status === 'error' ? (
				<div className="space-y-6">
					<Notice>{error}</Notice>
					<Link href="/auth/sign-in" className={buttonClasses('primary', 'lg', { fullWidth: true })}>
						Sign in
					</Link>
				</div>
			) : null}

			{status === 'pending' ? (
				<div className="space-y-6">
					<p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
						We have sent a verification link to{' '}
						{email ? <span className="text-[var(--color-ink)]">{email}</span> : 'your email'}. Open it to
						activate your account.
					</p>
					{email ? (
						<button
							type="button"
							onClick={handleResend}
							disabled={resending || resent}
							className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-primary-bright)] disabled:opacity-40"
						>
							{resent ? 'Email resent' : resending ? 'Resending...' : 'Resend verification email'}
						</button>
					) : null}
				</div>
			) : null}
		</AuthShell>
	);
}
