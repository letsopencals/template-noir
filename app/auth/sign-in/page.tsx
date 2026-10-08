'use client';

import { Suspense, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { AuthFallback, FIELD_LABEL, Notice } from '@/components/auth/auth-feedback';

const emailSchema = z.string().min(1, 'Email is required').email('Please enter a valid email');

type Step = 'email' | 'choose' | 'code' | 'password';

const TEXT_LINK =
	'w-full text-center text-xs uppercase tracking-[0.2em] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-primary-bright)] disabled:opacity-40';

const INTRO: Record<Step, string> = {
	email: 'Sign in to see your rentals, handover times and receipts.',
	choose: 'Choose how you would like to sign in.',
	code: 'Enter the code we emailed you.',
	password: 'Enter your password.',
};

export default function SignInPage() {
	return (
		<Suspense fallback={<AuthFallback />}>
			<SignInContent />
		</Suspense>
	);
}

function SignInContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get('callbackUrl') ?? '/account';

	const [step, setStep] = useState<Step>('email');
	const [email, setEmail] = useState('');
	const [code, setCode] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [cooldown, setCooldown] = useState(0);

	// Resend cooldown timer
	useEffect(() => {
		if (cooldown <= 0) return;
		const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
		return () => clearTimeout(id);
	}, [cooldown]);

	const goToChoose = () => {
		setError(null);
		const parsed = emailSchema.safeParse(email);
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? 'Please enter a valid email');
			return;
		}
		setStep('choose');
	};

	const sendCode = async () => {
		setError(null);
		setLoading(true);
		try {
			await fetch('/api/auth/request-login-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});
			setCooldown(60);
			setCode('');
			setStep('code');
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const verifyCode = async () => {
		setError(null);
		if (code.trim().length < 6) {
			setError('Enter the 6-digit code from your email.');
			return;
		}
		setLoading(true);
		try {
			const result = await signIn('login-code', { email, code: code.trim(), redirect: false });
			if (result?.error) {
				setError('That code is invalid or expired. Please try again.');
			} else {
				router.push(callbackUrl);
				router.refresh();
			}
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const signInWithPassword = async () => {
		setError(null);
		if (password.length < 6) {
			setError('Password must be at least 6 characters.');
			return;
		}
		setLoading(true);
		try {
			const result = await signIn('credentials', { email, password, redirect: false });
			if (result?.error) {
				setError('Invalid email or password.');
			} else {
				router.push(callbackUrl);
				router.refresh();
			}
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const useDifferentEmail = () => {
		setError(null);
		setCode('');
		setPassword('');
		setStep('email');
	};

	return (
		<AuthShell
			title={'Welcome\nback.'}
			intro={INTRO[step]}
			footer={
				<>
					New to NOIR Drive? <AuthLink href="/auth/sign-up">Create an account</AuthLink>
				</>
			}
		>
				{error ? <Notice className="mb-6">{error}</Notice> : null}

				{/* Step 1: email */}
				{step === 'email' ? (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							goToChoose();
						}}
						className="space-y-5"
					>
						<div>
							<label htmlFor="signin-email" className={FIELD_LABEL}>Email</label>
							<Input
								id="signin-email"
								type="email"
								autoComplete="email"
								autoFocus
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="your@email.com"
							/>
						</div>
						<Button type="submit" variant="primary" size="lg" fullWidth>
							Continue
						</Button>
					</form>
				) : null}

				{/* Step 2: choose method */}
				{step === 'choose' ? (
					<div className="space-y-5">
						<p className="text-sm text-[var(--color-ink-muted)]">
							How would you like to sign in as{' '}
							<span className="font-medium text-[var(--color-ink)]">{email}</span>?
						</p>
						<Button type="button" variant="primary" size="lg" fullWidth onClick={sendCode} disabled={loading}>
							{loading ? 'Sending...' : 'Email me a login code'}
						</Button>
						<Button
							type="button"
							variant="outline"
							size="lg"
							fullWidth
							onClick={() => {
								setError(null);
								setStep('password');
							}}
							disabled={loading}
						>
							Use my password
						</Button>
						<button
							type="button"
							onClick={useDifferentEmail}
							className={TEXT_LINK}
						>
							Use a different email
						</button>
					</div>
				) : null}

				{/* Step 3a: code entry */}
				{step === 'code' ? (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							verifyCode();
						}}
						className="space-y-5"
					>
						<p className="text-sm text-[var(--color-ink-muted)]">
							We sent a 6-digit code to{' '}
							<span className="font-medium text-[var(--color-ink)]">{email}</span>.
						</p>
						<Input
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							autoFocus
							maxLength={6}
							value={code}
							onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
							placeholder="000000"
							aria-label="6-digit login code"
							className="tabular h-14 text-center text-xl tracking-[0.6em]"
						/>
						<Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
							{loading ? 'Verifying...' : 'Sign In'}
						</Button>
						<button
							type="button"
							onClick={sendCode}
							disabled={cooldown > 0 || loading}
							className={TEXT_LINK}
						>
							{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
						</button>
						<button
							type="button"
							onClick={useDifferentEmail}
							className={TEXT_LINK}
						>
							Use a different email
						</button>
					</form>
				) : null}

				{/* Step 3b: password */}
				{step === 'password' ? (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							signInWithPassword();
						}}
						className="space-y-5"
					>
						<div>
							<label htmlFor="signin-password" className={FIELD_LABEL}>Password</label>
							<Input
								id="signin-password"
								type="password"
								autoComplete="current-password"
								autoFocus
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
							/>
						</div>
						<div className="flex justify-end">
							<Link
								href="/auth/forgot-password"
								className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-primary-bright)]"
							>
								Forgot password?
							</Link>
						</div>
						<Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
							{loading ? 'Signing in...' : 'Sign In'}
						</Button>
						<button
							type="button"
							onClick={() => {
								setError(null);
								setPassword('');
								setStep('choose');
							}}
							className={TEXT_LINK}
						>
							Back
						</button>
					</form>
				) : null}
		</AuthShell>
	);
}
