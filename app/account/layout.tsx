import type { Metadata } from 'next';
import { AccountNav, MobileSignOut } from '@/components/account/account-nav';
import { Reveal } from '@/components/motion/reveal';

export const metadata: Metadata = {
	title: 'My account',
	robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
	return (
		<section className="min-h-screen bg-[var(--color-bg)] pt-32 pb-24 lg:pt-44 lg:pb-32">
			<div className="mx-auto max-w-[1400px] px-6 lg:px-10">
				<div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
					<aside className="lg:col-span-3">
						<AccountNav />
					</aside>
					<Reveal className="min-w-0 lg:col-span-9">
						{children}
						<MobileSignOut />
					</Reveal>
				</div>
			</div>
		</section>
	);
}
