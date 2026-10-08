import { getFleet, getProduct } from '@/lib/server-data';
import { BookingView } from '@/components/booking/booking-view';
import { publicProduct } from '@/lib/public-payload';
import type { PreferredCarOption } from '@/components/booking/chauffeur/preferred-car-picker';

// Server Component: fetch the package on the server and seed the client booking
// flow so it renders immediately. The flow keeps revalidating via SWR against
// /api/products/[slug]. The product is scrubbed of staff PII before it reaches the
// client, and the fleet is reduced to slug/title/image for the preferred-car picker.
export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const [product, fleet] = await Promise.all([getProduct(slug), getFleet().catch(() => [])]);

	const cars: PreferredCarOption[] = fleet.map((car) => ({
		slug: car.slug,
		title: car.title,
		image: car.images.side ?? car.images.front ?? null,
	}));

	return <BookingView slug={slug} initialProduct={product ? publicProduct(product) : null} cars={cars} />;
}
