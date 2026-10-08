'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { clsx } from 'clsx';
import { useCart } from '@/contexts/cart-context';
import { siteConfig } from '@/lib/site-config';
import { buttonClasses } from '@/components/ui/button';
import { Wordmark } from '@/components/layout/wordmark';
import { MenuOverlay } from '@/components/layout/menu-overlay';

const CartDrawer = dynamic(() => import('@/components/cart/cart-drawer').then((m) => m.CartDrawer), {
	ssr: false,
});

const SCROLL_THRESHOLD = 32;

/**
 * Fixed site header. Transparent over the hero, then a black glass bar with a
 * hairline once the page scrolls. The hamburger opens the full-screen menu at
 * every breakpoint; desktop also shows the inline links.
 */
export function Header() {
	const pathname = usePathname();
	const { status } = useSession();
	const { cart } = useCart();
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [cartOpen, setCartOpen] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	const closeMenu = useCallback(() => setMenuOpen(false), []);
	const closeCart = useCallback(() => setCartOpen(false), []);
	const itemCount = cart?.items?.length ?? 0;
	const accountHref = status === 'authenticated' ? '/account' : '/auth/sign-in';

	return (
		<>
			<header
				className={clsx(
					'fixed inset-x-0 top-0 z-[60] transition-[background-color,border-color,backdrop-filter] duration-500',
					scrolled || menuOpen ? 'glass-nav' : 'border-b border-transparent bg-transparent',
				)}
			>
				<div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-6 px-5 lg:h-20 lg:px-10">
					<Link href="/" aria-label={`${siteConfig.name} home`} className="text-[1.6rem] lg:text-[1.9rem]">
						<Wordmark />
					</Link>

					<nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
						{siteConfig.nav.map((link) => {
							const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
							return (
								<Link
									key={link.href}
									href={link.href}
									aria-current={active ? 'page' : undefined}
									className={clsx(
										'link-underline text-[0.7rem] font-medium uppercase tracking-[0.24em] transition-colors',
										active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
									)}
								>
									{link.label}
								</Link>
							);
						})}
					</nav>

					<div className="flex items-center gap-1 sm:gap-2">
						<Link
							href={siteConfig.navCta.href}
							className={buttonClasses('primary', 'sm', { className: 'mr-2 max-sm:hidden' })}
						>
							{siteConfig.navCta.label}
						</Link>

						<Link
							href={accountHref}
							aria-label={status === 'authenticated' ? 'My account' : 'Sign in'}
							className="flex h-10 w-10 items-center justify-center text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
						>
							<svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} aria-hidden>
								<circle cx="12" cy="8" r="4" />
								<path strokeLinecap="round" d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
							</svg>
						</Link>

						<button
							type="button"
							onClick={() => setCartOpen(true)}
							aria-label={itemCount > 0 ? `Open cart, ${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Open cart'}
							className="relative flex h-10 w-10 items-center justify-center text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
						>
							<svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} aria-hidden>
								<path strokeLinejoin="round" d="M5 8h14l-1.2 12H6.2L5 8z" />
								<path strokeLinecap="round" d="M9 8V6a3 3 0 016 0v2" />
							</svg>
							{itemCount > 0 ? (
								<span className="tabular absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[0.58rem] font-semibold text-black">
									{itemCount}
								</span>
							) : null}
						</button>

						<button
							type="button"
							onClick={() => setMenuOpen((o) => !o)}
							aria-label={menuOpen ? 'Close menu' : 'Open menu'}
							aria-expanded={menuOpen}
							aria-controls="site-menu"
							className="group flex h-10 w-10 flex-col items-end justify-center gap-[7px] pl-2"
						>
							<span
								className={clsx(
									'block h-px bg-[var(--color-ink)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
									menuOpen ? 'w-6 translate-y-[4px] rotate-45' : 'w-6',
								)}
							/>
							<span
								className={clsx(
									'block h-px bg-[var(--color-ink)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
									menuOpen ? 'w-6 -translate-y-[4px] -rotate-45' : 'w-4 group-hover:w-6',
								)}
							/>
						</button>
					</div>
				</div>
			</header>

			<MenuOverlay open={menuOpen} onClose={closeMenu} />
			<CartDrawer open={cartOpen} onClose={closeCart} />
		</>
	);
}
