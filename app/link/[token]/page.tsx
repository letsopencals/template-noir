'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resolveLink, type ResolveLinkResult } from '@/app/auth/actions/resolve-link';
import { buttonClasses } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/auth-shell';
import { Spinner } from '@/components/auth/auth-feedback';

const ERROR_COPY: Record<NonNullable<ResolveLinkResult['errorCode']>, { title: string; message: string }> = {
	TOKEN_EXPIRED: { title: 'Link\nexpired.', message: 'This link has expired. Sign in to see your booking, or ask us for a new link.' },
	TOKEN_USED: { title: 'Link\nalready used.', message: 'This link has already been used. Sign in to continue.' },
	TOKEN_INVALID: { title: 'Invalid\nlink.', message: 'This link is invalid or could not be found.' },
};

/**
 * The backend emits `/account/appointments/{id}/view(?action=...)`, but this
 * template's detail route is `/account/appointments/{id}`. Strip the trailing
 * `/view` segment while preserving any query string (e.g. `?action=cancel`).
 */
function normalizeRedirect(path: string): string {
	return path.replace(/^(\/account\/appointments\/[^/]+)\/view/, '$1');
}

export default function LinkPage() {
	const router = useRouter();
	const params = useParams<{ token: string }>();
	const token = params?.token;

	const [status, setStatus] = useState<'resolving' | 'error'>('resolving');
	const [errorCode, setErrorCode] = useState<NonNullable<ResolveLinkResult['errorCode']>>('TOKEN_INVALID');
	const ranRef = useRef(false);

	useEffect(() => {
		if (!token || ranRef.current) return;
		ranRef.current = true;

		(async () => {
			const result = await resolveLink(token);
			if (result.success && result.redirectPath) {
				router.replace(normalizeRedirect(result.redirectPath));
				router.refresh();
			} else {
				setErrorCode(result.errorCode ?? 'TOKEN_INVALID');
				setStatus('error');
			}
		})();
	}, [token, router]);

	if (status === 'resolving') {
		return (
			<AuthShell eyebrow="Secure link" title={'One\nmoment.'}>
				<div className="flex items-center gap-4 text-sm text-[var(--color-ink-muted)]">
					<Spinner className="h-6 w-6" />
					Signing you in...
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell key="error" eyebrow="Secure link" title={ERROR_COPY[errorCode].title} intro={ERROR_COPY[errorCode].message}>
			<Link href="/auth/sign-in" className={buttonClasses('primary', 'lg', { fullWidth: true })}>
				Sign in
			</Link>
		</AuthShell>
	);
}
