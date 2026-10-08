'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { clsx } from 'clsx';

const LINKS = [
	{ href: '/account', label: 'Overview' },
	{ href: '/account/appointments', label: 'Bookings' },
	{ href: '/account/orders', label: 'Orders' },
	{ href: '/account/settings', label: 'Settings' },
] as const;

function isActive(pathname: string, href: string): boolean {
	return href === '/account' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Account sidebar: customer name, numbered section links, sign out. */
export function AccountNav() {
	const pathname = usePathname();
	const { data: session } = useSession();
	const customerName = [session?.customer?.firstName, session?.customer?.lastName].filter(Boolean).join(' ');

	return (
		<nav aria-label="Account" className="lg:sticky lg:top-32">
			<div className="border-b border-[var(--color-line)] pb-6">
				<p className="eyebrow">Signed in</p>
				<p className="mt-3 truncate text-base text-[var(--color-ink)]">{customerName || 'My account'}</p>
				{session?.customer?.email ? (
					<p className="mt-1 truncate text-xs text-[var(--color-ink-muted)]">{session.customer.email}</p>
				) : null}
			</div>

			<ul className="no-scrollbar -mx-6 flex gap-1 overflow-x-auto px-6 py-4 lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:py-6">
				{LINKS.map((link, i) => {
					const active = isActive(pathname, link.href);
					return (
						<li key={link.href} className="shrink-0">
							<Link
								href={link.href}
								aria-current={active ? 'page' : undefined}
								className={clsx(
									'group flex items-center gap-4 border-l px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.24em] transition-colors lg:py-3',
									active
										? 'border-[var(--color-primary)] text-[var(--color-ink)]'
										: 'border-transparent text-[var(--color-ink-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]',
								)}
							>
								<span className={clsx('tabular text-[0.62rem]', active ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink-dim)]')}>
									{String(i + 1).padStart(2, '0')}
								</span>
								{link.label}
							</Link>
						</li>
					);
				})}
			</ul>

			<div className="hidden border-t border-[var(--color-line)] pt-6 lg:block">
				<button
					type="button"
					onClick={() => signOut({ callbackUrl: '/' })}
					className="px-4 text-[0.7rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)] transition-colors hover:text-red-300"
				>
					Sign out
				</button>
			</div>
		</nav>
	);
}

/** Mobile-only sign out (the sidebar one is hidden below lg). */
export function MobileSignOut() {
	return (
		<button
			type="button"
			onClick={() => signOut({ callbackUrl: '/' })}
			className="mt-16 w-full border-t border-[var(--color-line)] pt-6 text-center text-[0.7rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)] transition-colors hover:text-red-300 lg:hidden"
		>
			Sign out
		</button>
	);
}
