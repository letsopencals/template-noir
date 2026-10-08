import type { Metadata } from 'next';
export const metadata: Metadata = {
	title: 'Book a chauffeur',
	description: 'Choose a package, a time and your chauffeur.',
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
	return children;
}
