import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ThankYouView } from '@/components/booking/thank-you/thank-you-view';

export const metadata: Metadata = {
	title: 'Booking confirmed',
	robots: { index: false, follow: false },
};

function Fallback() {
	return <div className="min-h-[70vh]" aria-busy />;
}

// RSC shell; the client view reads ?orderId (useSearchParams needs a Suspense boundary).
export default function ThankYouPage() {
	return (
		<Suspense fallback={<Fallback />}>
			<ThankYouView />
		</Suspense>
	);
}
